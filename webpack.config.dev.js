const merge = require('webpack-merge');
const common = require('./webpack.config.common.js'); 

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  optimization: {
    chunkIds: 'named',
  },
  devServer: {
    static: {
      publicPath: './build',
    },
  },
});