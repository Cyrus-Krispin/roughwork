import type { Configuration } from 'webpack';
import { DefinePlugin, NormalModuleReplacementPlugin } from 'webpack';

import { plugins } from './webpack.plugins';
import { rules } from './webpack.rules';

export const mainConfig: Configuration = {
  entry: './src/index.ts',
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    ...(process.env.STRATA_E2E_FAKE_PROVIDER === '1'
      ? [
          new NormalModuleReplacementPlugin(/e2eProvider\.ts$/u, (resource) => {
            resource.request = resource.request.replace(
              /e2eProvider\.ts$/u,
              'e2eFakeProvider.ts',
            );
          }),
        ]
      : []),
    new DefinePlugin({
      STRATA_E2E_FAKE_PROVIDER: JSON.stringify(
        process.env.STRATA_E2E_FAKE_PROVIDER === '1',
      ),
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
};
