import type { Configuration } from 'webpack';

import { plugins } from './webpack.plugins';
import { rules } from './webpack.rules';

export const rendererConfig: Configuration = {
  // Keep the renderer compatible with the production CSP. Webpack's default
  // development source map uses eval(), which Electron correctly blocks.
  devtool: 'source-map',
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
};
