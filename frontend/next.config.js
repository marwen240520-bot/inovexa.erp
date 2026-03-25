/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  turbopack: {},
};

module.exports = nextConfig;
