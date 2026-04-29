/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // 开发阶段不启用静态导出，保留 SSR/HMR 能力
  // output: 'export',  // 仅在 build 阶段通过 NODE_ENV 条件启用

  // 完全排除 design-sandbox 目录，防止被 Next.js 扫描
  webpack: (config) => {
    config.module.rules.push({
      test: /design-sandbox\/.*/,
      use: 'null-loader',
    })

    // 确保 '@/...' 解析到根 src
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }

    return config
  },

  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: true,
  },

  // 图片配置（静态导出需要）
  images: {
    unoptimized: true,
  },
}

// 开发环境移除静态导出，避免编译卡死
if (process.env.NODE_ENV === 'development') {
  nextConfig.output = 'standalone'  // 或直接不设置（默认）
}

module.exports = nextConfig
