import type ForkTsCheckerWebpackPluginType from 'fork-ts-checker-webpack-plugin';

// Forge's Webpack template loads this CommonJS plugin through require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ForkTsCheckerWebpackPlugin: typeof ForkTsCheckerWebpackPluginType = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
];
