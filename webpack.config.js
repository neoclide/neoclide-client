const prod = process.env.NODE_ENV == 'production'
const webpack = require('webpack')
const plugins = []

if (prod) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    },
    mangle: {
      except: ['Polymer', 'exports', 'require']
    }
  }))
  plugins.push(new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  }))
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: 'build',
    filename: 'bundle.js'
  },
  devtool: prod ? 'source-map' : 'eval-source-map',
  resolve: {
    root: __dirname,
    packageAlias: 'browser'
  },
  target: 'electron',
  externals: {
    /*做为 commonjs 模块载入*/
    'keyboard-layout': "commonjs keyboard-layout",
    'imselect': "commonjs imselect",
    polymer: 'Polymer'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader?cacheDirectory'
    }]
  },
  plugins: plugins
}
