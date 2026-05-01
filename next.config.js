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

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
