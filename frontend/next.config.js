/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Transpile packages
  transpilePackages: [],
  
  // Configuration des images
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
  },

  // Configuration webpack pour Chart.js
  webpack: (config, { isServer, dev }) => {
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    // Optimisations pour Chart.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Ignorer les avertissements spécifiques à Chart.js
      config.ignoreWarnings = [
        { module: /node_modules\/chart\.js/ },
        { message: /eval/ },
      ];
    }
    
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce: true,
            },
            chartjs: {
              test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
              name: 'chartjs-vendor',
              priority: 35,
              reuseExistingChunk: true,
            },
            lib: {
              test(module) {
                return (
                  module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier())
                );
              },
              name(module) {
                const hash = require('crypto')
                  .createHash('sha1')
                  .update(module.identifier())
                  .digest('hex')
                  .substring(0, 8);
                return `chunk-${hash}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return `shared-${chunks.map(c => c.name).join('-')}`;
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // ✅ Configuration CSP CORRIGÉE pour Chart.js
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://flagcdn.com http://localhost:3001",
      "font-src 'self' data:",
      "connect-src 'self' data: blob: http://localhost:3001 ws://localhost:3001 https://*.tld",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Compression des assets
  compress: true,

  // Génération standalone pour déploiement
  output: 'standalone',

  // Variables d'environnement exposées au client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_APP_NAME: 'Inovexa ERP',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Solution ERP nouvelle génération',
  },

  // Génération des ETags
  generateEtags: true,

  // Timeout pour les pages statiques (en secondes)
  staticPageGenerationTimeout: 120,

  // Configuration des logs
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Désactiver l'indicateur de développement en production
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Configuration des pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig;