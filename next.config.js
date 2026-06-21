/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // 在开发模式下禁用output，只在生产环境启用
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // GitHub Pages 子路径 - 通过环境变量控制
  // 本地构建: BASE_PATH=''  CI构建: BASE_PATH=/seeing-single-cell
  basePath: typeof process.env.BASE_PATH !== 'undefined' ? process.env.BASE_PATH : '',
  assetPrefix: process.env.BASE_PATH || '',
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: false,
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

  // redirects: 静态导出不支持，已在 public/ 目录创建 HTML 重定向页面
}

module.exports = nextConfig
