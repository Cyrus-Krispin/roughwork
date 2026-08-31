import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('pins the 0.1 macOS product identity and toolchain', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const forgeConfig = await readFile(
    new URL('../forge.config.ts', import.meta.url),
    'utf8',
  );
  const webpackConfig = await readFile(
    new URL('../webpack.main.config.ts', import.meta.url),
    'utf8',
  );
  const productionE2eProvider = await readFile(
    new URL('../src/main/ai/e2eProvider.ts', import.meta.url),
    'utf8',
  );

  assert.equal(packageJson.version, '0.1.0');
  assert.equal(packageJson.packageManager, 'npm@11.12.1');
  assert.equal(packageJson.engines.node, '>=24 <27');
  assert.equal(packageJson.engines.npm, '>=11 <12');
  assert.match(forgeConfig, /appBundleId: 'ai\.strata\.learning'/);
  assert.match(
    forgeConfig,
    /appCategoryType: 'public\.app-category\.education'/,
  );
  assert.match(forgeConfig, /LSMinimumSystemVersion: '13\.0'/);
  assert.match(forgeConfig, /strictlyRequireAllFuses: true/);
  assert.match(
    forgeConfig,
    /FuseV1Options\.GrantFileProtocolExtraPrivileges\]: true/,
  );
  assert.match(
    forgeConfig,
    /FuseV1Options\.LoadBrowserProcessSpecificV8Snapshot\]: false/,
  );
  assert.doesNotMatch(forgeConfig, /Maker(?:Deb|Rpm|Squirrel)/);
  assert.equal(
    packageJson.scripts['package:e2e'],
    'STRATA_E2E_FAKE_PROVIDER=1 electron-forge package',
  );
  const workflow = await readFile(
    new URL('../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /runner: macos-15\b/u);
  assert.match(workflow, /runner: macos-15-intel\b/u);
  assert.doesNotMatch(workflow, /macos-14/u);
  assert.equal(
    packageJson.scripts['verify:packaged-flow'],
    'node scripts/verify-packaged-flow.mjs',
  );
  assert.equal(
    packageJson.scripts['verify:packaged-onboarding'],
    'node scripts/verify-packaged-flow.mjs --onboarding',
  );
  assert.match(webpackConfig, /NormalModuleReplacementPlugin/);
  assert.match(webpackConfig, /STRATA_E2E_FAKE_PROVIDER === '1'/);
  assert.match(productionE2eProvider, /return null/);
  assert.doesNotMatch(
    productionE2eProvider,
    /DiagnosticQuestion|EvaluationResult/,
  );
});

test('wires the hardened renderer policy into the application entry point', async () => {
  const main = await readFile(
    new URL('../src/index.ts', import.meta.url),
    'utf8',
  );
  const html = await readFile(
    new URL('../src/index.html', import.meta.url),
    'utf8',
  );

  for (const policy of [
    'allowRunningInsecureContent: false',
    'contextIsolation: true',
    'navigateOnDragDrop: false',
    'nodeIntegration: false',
    'sandbox: true',
    'webSecurity: true',
    'webviewTag: false',
    "webContents.on('will-navigate'",
    "webContents.on('will-redirect'",
    'setWindowOpenHandler',
    'denyAllRendererPermissions(session.defaultSession)',
    'enforceProductionContentSecurityPolicy',
    'process.umask(0o077)',
    "Strata AI couldn't open your local history.",
    'Nothing has been deleted.',
    'Preserve files and start empty',
    'preserveLearningDatabaseFiles',
  ]) {
    assert.match(
      main,
      new RegExp(policy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  assert.match(html, /object-src 'none'/);
  assert.match(html, /worker-src 'none'/);
});
