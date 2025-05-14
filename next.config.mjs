// Load environment variables from .env file
import { config } from 'dotenv';
config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode for wallet compatibility
  swcMinify: true,
  images: {
    domains: ['gateway.pinata.cloud', 'placehold.co', 'assets.mixkit.co', 'images.unsplash.com'],
    unoptimized: true,
  },
  // Remove the static export configuration
  // output: 'export',
  // distDir: 'build',
  // Add trailing slashes to URLs for better compatibility
  trailingSlash: true,
  // Disable basePath as it can cause issues
  basePath: '',
  // Reduce build strictness
  eslint: { 
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Optimize compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Only enable webpack bundle analyzer in production builds
    if (!dev && !isServer) {
      // Optionally use webpack bundle analyzer by uncommenting:
      // const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      // config.plugins.push(new BundleAnalyzerPlugin({
      //   analyzerMode: 'server',
      //   analyzerPort: 8888,
      //   openAnalyzer: false,
      // }));
    }

    return config;
  },
  // Make environment variables available to the browser
  env: {
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    NEXT_PUBLIC_PINATA_GATEWAY_URL: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL,
    NEXT_PUBLIC_PINATA_API_KEY: process.env.PINATA_API_KEY,
    NEXT_PUBLIC_PINATA_API_SECRET: process.env.PINATA_API_SECRET,
    NEXT_PUBLIC_PINATA_JWT: process.env.PINATA_JWT,
  },
};

export default nextConfig;
