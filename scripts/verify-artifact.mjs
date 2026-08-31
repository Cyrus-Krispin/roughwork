import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import asar from '@electron/asar';
import { FuseState, FuseV1Options, getCurrentFuseWire } from '@electron/fuses';

if (process.platform !== 'darwin') {
  throw new Error('Artifact verification currently supports macOS only.');
}

const appPath = resolve(
  process.argv[2] ?? `out/Strata AI-darwin-${process.arch}/Strata AI.app`,
);
const pathArchitecture = appPath.match(/darwin-(arm64|x64)/u)?.[1];
const expectedArchitecture =
  process.argv[3] ?? pathArchitecture ?? process.arch;
if (!['arm64', 'x64'].includes(expectedArchitecture)) {
  throw new Error('Expected architecture must be arm64 or x64.');
}
const contentsPath = join(appPath, 'Contents');
const resourcesPath = join(contentsPath, 'Resources');
const executablePath = join(contentsPath, 'MacOS', 'Strata AI');
const asarPath = join(resourcesPath, 'app.asar');

function plistValue(key) {
  return execFileSync(
    'plutil',
    ['-extract', key, 'raw', '-o', '-', join(contentsPath, 'Info.plist')],
    { encoding: 'utf8' },
  ).trim();
}

assert.equal(plistValue('CFBundleIdentifier'), 'ai.strata.learning');
assert.equal(plistValue('CFBundleShortVersionString'), '0.1.0');
assert.equal(plistValue('CFBundleVersion'), '0.1.0');
assert.equal(
  plistValue('LSApplicationCategoryType'),
  'public.app-category.education',
);
assert.equal(plistValue('LSMinimumSystemVersion'), '13.0');
assert.equal(
  plistValue('NSAppTransportSecurity.NSAllowsArbitraryLoads'),
  'false',
);

const plist = execFileSync('plutil', ['-p', join(contentsPath, 'Info.plist')], {
  encoding: 'utf8',
});
for (const unnecessaryPermission of [
  'NSBluetoothAlwaysUsageDescription',
  'NSBluetoothPeripheralUsageDescription',
  'NSCameraUsageDescription',
  'NSAudioCaptureUsageDescription',
  'NSMicrophoneUsageDescription',
]) {
  assert.doesNotMatch(plist, new RegExp(unnecessaryPermission));
}

execFileSync(
  'codesign',
  ['--verify', '--deep', '--strict', '--verbose=2', appPath],
  { stdio: 'pipe' },
);
const executableArchitectures = execFileSync(
  'lipo',
  ['-archs', executablePath],
  { encoding: 'utf8' },
)
  .trim()
  .split(/\s+/u);
assert.deepEqual(executableArchitectures, [
  expectedArchitecture === 'x64' ? 'x86_64' : 'arm64',
]);

const fuseWire = await getCurrentFuseWire(executablePath);
const expectedFuses = {
  [FuseV1Options.RunAsNode]: FuseState.DISABLE,
  [FuseV1Options.EnableCookieEncryption]: FuseState.ENABLE,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: FuseState.DISABLE,
  [FuseV1Options.EnableNodeCliInspectArguments]: FuseState.DISABLE,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: FuseState.ENABLE,
  [FuseV1Options.OnlyLoadAppFromAsar]: FuseState.ENABLE,
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: FuseState.DISABLE,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: FuseState.ENABLE,
  [FuseV1Options.WasmTrapHandlers]: FuseState.ENABLE,
};
assert.equal(fuseWire.version, '1');
assert.deepEqual(
  Object.fromEntries(
    Object.entries(fuseWire).filter(([key]) => key !== 'version'),
  ),
  Object.fromEntries(
    Object.entries(expectedFuses).map(([key, value]) => [key, value]),
  ),
);

const packagedIcon = await readFile(join(resourcesPath, 'electron.icns'));
const sourceIcon = await readFile(resolve('assets/icon.icns'));
assert.deepEqual(packagedIcon, sourceIcon);

const asarEntries = await asar.listPackage(asarPath);
for (const forbidden of [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)tests?\//i,
  /fixtures?/i,
  /provider-credential\.json/i,
  /strata-ai\.sqlite/i,
  /src\//i,
]) {
  assert.equal(
    asarEntries.some((entry) => forbidden.test(entry)),
    false,
    `Packaged ASAR contains forbidden entry matching ${forbidden}`,
  );
}
const packagedManifest = JSON.parse(
  asar.extractFile(asarPath, 'package.json').toString('utf8'),
);
assert.equal(packagedManifest.version, '0.1.0');
assert.equal(packagedManifest.productName, 'Strata AI');
const packagedMain = asar.extractFile(asarPath, '.webpack/main/index.js');
assert.doesNotMatch(
  packagedMain.toString('utf8'),
  /STRATA_E2E_BUILD_ONLY_PROVIDER|strata-e2e-build-only-key|strata-e2e-fake/,
  'Production artifact contains the build-only E2E provider.',
);

const asarSize = (await stat(asarPath)).size;
assert.ok(
  asarSize < 15 * 1024 * 1024,
  'Packaged application code exceeds 15 MB.',
);

console.log(
  `Verified Strata AI 0.1.0 (${expectedArchitecture}): architecture, identity, plist, icon, signature, fuses, and ASAR contents.`,
);
