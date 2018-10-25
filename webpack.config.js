webpack = require("webpack");
module.exports = {
  entry: "./landing/src/app.js",
  mode: "production",
  output: {
    path: __dirname + "/landing/dist",
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
    contentBase: "./"
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      Popper: ["popper.js", "default"]
    })
  ]
};
