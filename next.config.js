/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/seeing-single-cell' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/seeing-single-cell/' : '',
}

module.exports = nextConfig
