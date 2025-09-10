const merge = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  optimization: {
    chunkIds: 'named',
  },
  devServer: {
    static: {
      publicPath: './build',
    },
    client: { overlay: false },
      historyApiFallback: {
          index: '/index.html',
          disableDotRule: true,
      },
  },
});
