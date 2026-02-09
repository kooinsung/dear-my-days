import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  reactStrictMode: true,
  // Allow cross-origin requests from Capacitor mobile apps
  allowedDevOrigins: [
    '10.0.2.2', // Android emulator
    'localhost', // iOS simulator
    '127.0.0.1', // iOS simulator (alternative)
  ],
  async rewrites() {
    return [
      {
        source: '/api/health-check',
        destination: 'http://localhost:3000/api/health-check',
        basePath: false,
      },
    ]
  },
}

export default nextConfig
