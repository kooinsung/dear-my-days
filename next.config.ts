import type { NextConfig } from 'next'

const { BASE_PATH } = process.env

const nextConfig: NextConfig = {
  reactCompiler: true,
  basePath: BASE_PATH,
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/health-check',
        destination: `http://localhost:3000${BASE_PATH}/api/health-check`,
        basePath: false,
      },
    ]
  },
}

export default nextConfig
