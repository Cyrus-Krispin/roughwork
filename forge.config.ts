import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// plist is used only while producing the macOS artifact.
const plist: {
  parse(value: string): Record<string, unknown>;
  build(value: Record<string, unknown>): string;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('plist');
const execFileAsync = promisify(execFile);

type ElectronFusesModule = {
  flipFuses(
    electronPath: string,
    config: Record<string | number, unknown>,
  ): Promise<void>;
  FuseVersion: { V1: string };
  FuseV1Options: Record<
    | 'RunAsNode'
    | 'EnableCookieEncryption'
    | 'EnableNodeOptionsEnvironmentVariable'
    | 'EnableNodeCliInspectArguments'
    | 'EnableEmbeddedAsarIntegrityValidation'
    | 'OnlyLoadAppFromAsar'
    | 'LoadBrowserProcessSpecificV8Snapshot'
    | 'GrantFileProtocolExtraPrivileges'
    | 'WasmTrapHandlers',
    number
  >;
};

const appleSignIdentity = process.env.APPLE_SIGN_IDENTITY?.trim();
const appleId = process.env.APPLE_ID?.trim();
const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD?.trim();
const appleTeamId = process.env.APPLE_TEAM_ID?.trim();
const osxSign = appleSignIdentity
  ? { identity: appleSignIdentity, hardenedRuntime: true }
  : undefined;
const osxNotarize =
  osxSign && appleId && appleIdPassword && appleTeamId
    ? { appleId, appleIdPassword, teamId: appleTeamId }
    : undefined;

async function hardenMacArtifact(
  buildPath: string,
  platform: string,
  arch: string,
): Promise<void> {
  if (platform !== 'darwin' || arch !== 'arm64') {
    throw new Error(
      'Strata AI release artifacts require macOS on Apple Silicon.',
    );
  }

  const contentsPath = resolve(buildPath, '..', '..');
  const infoPath = join(contentsPath, 'Info.plist');
  const info = plist.parse(await readFile(infoPath, 'utf8'));
  delete info.NSBluetoothAlwaysUsageDescription;
  delete info.NSBluetoothPeripheralUsageDescription;
  delete info.NSCameraUsageDescription;
  delete info.NSAudioCaptureUsageDescription;
  delete info.NSMicrophoneUsageDescription;
  info.NSAppTransportSecurity = { NSAllowsArbitraryLoads: false };
  await writeFile(infoPath, plist.build(info), 'utf8');

  const fusesModuleName = '@electron/fuses';
  const { flipFuses, FuseV1Options, FuseVersion } = (await import(
    fusesModuleName
  )) as ElectronFusesModule;
  await flipFuses(join(contentsPath, 'MacOS', 'Electron'), {
    version: FuseVersion.V1,
    strictlyRequireAllFuses: true,
    resetAdHocDarwinSignature: !osxSign,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    [FuseV1Options.WasmTrapHandlers]: true,
  });
}

const config: ForgeConfig = {
  packagerConfig: {
    appBundleId: 'ai.strata.learning',
    appCategoryType: 'public.app-category.education',
    appCopyright: 'Copyright © 2026 Cyrus. All rights reserved.',
    asar: true,
    darwinDarkModeSupport: true,
    extendInfo: {
      LSMinimumSystemVersion: '13.0',
      LSRequiresNativeExecution: true,
    },
    icon: './assets/icon',
    osxNotarize,
    osxSign,
  },
  rebuildConfig: {},
  makers: [new MakerZIP({}, ['darwin'])],
  hooks: {
    packageAfterCopy: async (_config, buildPath, _version, platform, arch) => {
      await hardenMacArtifact(buildPath, platform, arch);
    },
    postPackage: async (_config, result) => {
      if (result.platform !== 'darwin' || osxSign) return;
      for (const outputPath of result.outputPaths) {
        await execFileAsync('codesign', [
          '--force',
          '--deep',
          '--sign',
          '-',
          join(outputPath, 'Strata AI.app'),
        ]);
      }
    },
  },
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
