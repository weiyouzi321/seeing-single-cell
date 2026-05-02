/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // GitHub Pages 子路径 - 通过环境变量控制
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // 排除 design-sandbox
  exclude: [
    /[\\/]design-sandbox[\\/]/
  ],


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

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
