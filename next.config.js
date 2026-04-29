/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  // Images
  images: {
    unoptimized: true,
  },

  // 保持别名
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
