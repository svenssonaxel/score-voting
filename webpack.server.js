const path = require("path");
const nodeExternals = require("webpack-node-externals");

function prod_vs_dev(ret_production, ret_development) {
  if (process.env.NODE_ENV == "production") {
    return ret_production;
  }
  if (process.env.NODE_ENV == "development") {
    return ret_development;
  }
  throw Error("Unknown mode");
}

module.exports = {
  entry: "./server-src/index.js",

  target: "node",

  externals: prod_vs_dev([], [nodeExternals()]),

  output: {
    path: path.resolve(prod_vs_dev("server-build", "server-build-dev")),
    filename: "index.js",
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: "babel-loader",
      },
    ],
  },
};
