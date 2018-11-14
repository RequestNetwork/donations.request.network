const webpack = require("webpack");
const path = require("path");
const NodemonPlugin = require("nodemon-webpack-plugin"); // Ding
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackAutoInjectVersion = require("webpack-auto-inject-version");

module.exports = {
  entry: "./landing/src/app.js",
  mode: "production",
  output: {
    path: path.join(__dirname, "public", "dist"),
    filename: "[name].[contenthash].min.js"
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
      },
      {
        test: /\.tpl$/,
        loader: "ejs-loader",
        query: {
          interpolate: /\{\{(.+)\}\}/g,
          escape: "<$-(.+?)$>",
          evaluate: /\[\[(.+)\]\]/g,
          engine: "lodash"
        }
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
    }),
    new HtmlWebpackPlugin({
      template: "./landing/index.html.tpl",
      filename: "../index.html",
      hash: true,
      inject: false,
      minify: false
    }),
    new WebpackAutoInjectVersion()
  ]
};
