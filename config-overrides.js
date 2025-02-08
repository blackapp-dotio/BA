const { override, addWebpackAlias } = require('customize-cra');
const webpack = require('webpack');
const path = require('path');

module.exports = override((config) => {
  // ✅ Ensure `config.resolve` exists before modifying it
  if (!config.resolve) {
    config.resolve = {};
  }

  // ✅ Add alias for cleaner imports
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@': path.resolve(__dirname, 'src'),
  };

  // ✅ Ensure Webpack compatibility
  config.plugins = [
    ...(config.plugins || []),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
});
