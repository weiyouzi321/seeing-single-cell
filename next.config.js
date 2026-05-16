/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // 在开发模式下禁用output，只在生产环境启用
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // GitHub Pages 子路径 - 通过环境变量控制
  // 本地构建: BASE_PATH=''  CI构建: BASE_PATH=/seeing-single-cell
  basePath: typeof process.env.BASE_PATH !== 'undefined' ? process.env.BASE_PATH : '/seeing-single-cell',
  assetPrefix: process.env.BASE_PATH || '',
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // 排除 design-sandbox - 通过 webpack 别名和排除构建
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    // 排除 design-sandbox 目录
    if (config.externals) {
      config.externals.push(/design-sandbox/);
    }
    return config;
  },

  // 旧URL重定向 - 修复死链
  async redirects() {
    return [
      // 描述性slug → 数字ID路由 (永久重定向)
      { source: '/chapters/1-dimensionality-reduction', destination: '/chapters/1-matrix/', permanent: true },
      { source: '/chapters/3-clustering', destination: '/chapters/3-preprocessing/', permanent: true },
      { source: '/chapters/4-differential-expression', destination: '/chapters/4-pca/', permanent: true },
      { source: '/chapters/5-trajectory', destination: '/chapters/5-knn/', permanent: true },
    ]
  },
}

module.exports = nextConfig
