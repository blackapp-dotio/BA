const { override, addWebpackAlias } = require('customize-cra');
const webpack = require('webpack');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  }),

  (config) => {
    // ✅ Fix: Remove 'fallback' since Webpack 5 does not support it
    if (config.resolve) {
      delete config.resolve.fallback;
    }

    // ✅ Ensure Webpack compatibility
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );

    return config;
  }
);
