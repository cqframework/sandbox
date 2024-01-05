const merge = require('webpack-merge');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.config.common.js');
const crypto = require("crypto");
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = algorithm => crypto_orig_createHash(algorithm === "md4" ? "sha256" : algorithm);

module.exports = merge(common, {
  devtool: 'cheap-source-map',
  mode: 'production',
  plugins: [ ],
  optimization: {
    minimizer: [new TerserPlugin()],
  },
});
