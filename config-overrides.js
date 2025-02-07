const webpack = require("webpack");
const webpack = require("webpack");

module.exports = function override(config) {
  if (!config.resolve) {
    config.resolve = {};
  }
  
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/"),
  };

  // Add Webpack plugins
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    })
  );

  return config;
};
