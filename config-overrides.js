const webpack = require("webpack");

module.exports = function override(config) {
  // Ensure plugins array exists
  if (!config.plugins) {
    config.plugins = [];
  }

  // Add Webpack plugins
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    })
  );

  return config;
};
