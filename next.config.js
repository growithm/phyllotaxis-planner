/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 15の新機能を有効化
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // SVGファイルをReactコンポーネントとして使用可能にする
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  // 静的ファイルの最適化
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // 本番環境での最適化
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;