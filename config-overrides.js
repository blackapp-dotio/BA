const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/")
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    })
  );

  return config;
};
