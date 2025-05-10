/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode for wallet compatibility
  swcMinify: true,
  images: {
    domains: ['gateway.pinata.cloud', 'placehold.co', 'assets.mixkit.co', 'images.unsplash.com'],
    unoptimized: true, // Required for static export
  },
  // Static export configuration
  output: 'export',
  distDir: 'build',
  // Add trailing slashes to URLs for better static export compatibility
  trailingSlash: true,
  // Disable basePath as it can cause issues with static exports
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
};

export default nextConfig;
