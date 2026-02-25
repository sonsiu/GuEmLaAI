import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'dce5qd200mu0y.cloudfront.net'
      }
    ]
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300
      }
    }

    config.ignoreWarnings = [
      {
        module: /node_modules\/jsonwebtoken/,
        message: /Edge Runtime/
      },
      {
        module: /node_modules\/jws/,
        message: /Edge Runtime/
      }
    ]

    return config
  }
}

export default nextConfig
