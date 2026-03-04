const path = require('path')

const config = {
  projectName: 'inventory-miniapp-taro',
  date: '2026-02-16',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: 'react',
  compiler: { type: 'webpack5', prebundle: { enable: false } },
  cache: { enable: true },
  mini: {
    postcss: { pxtransform: { enable: true }, url: { enable: true, config: { limit: 10240 } } },
    webpackChain(chain) { },
  },
  h5: {},
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
