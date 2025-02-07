const webpack = require("webpack");

module.exports = function override(config) {
  // Ensure plugins array exists
  if (!config.plugins) {
    config.plugins = [];
  }

  // Add required polyfills for Webpack 5
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
    },
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
