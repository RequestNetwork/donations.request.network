const webpack = require("webpack");
const path = require("path");
const NodemonPlugin = require("nodemon-webpack-plugin"); // Ding

module.exports = {
  entry: "./landing/src/app.js",
  mode: "production",
  output: {
    path: path.join(__dirname, "public"),
    filename: "bundle.min.js"
  },
  module: {
    rules: [
      {
        test: /\.(css|scss|sass)$/,
        loaders: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/,
        loader: "url-loader"
      }
    ]
  },
  devServer: {
    open: true,
    watchContentBase: true
    // contentBase: path.join(__dirname, "landing"),
    // publicPath: path.join(__dirname, "landing")
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      Popper: ["popper.js", "default"]
    }),
    new NodemonPlugin({
      script: "./dist",
      watch: "./"
    })
  ]
};
