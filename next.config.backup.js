/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // 通过环境变量控制：开发阶段禁用 export，防止卡死
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // 完全排除 design-sandbox 目录
  webpack: (config) => {
    config.module.rules.push({
      test: /design-sandbox\/.*/,
      use: 'null-loader',
    })

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }

    return config
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
