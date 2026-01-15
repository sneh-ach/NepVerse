/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  // ESLint - don't fail build on linting errors (warnings only)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript - don't fail build on type errors (warnings only)
  typescript: {
    ignoreBuildErrors: false, // Keep type checking, but allow lint warnings
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nepverse-storage.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'fbdee46a9b838de85e14cf5a4ef887b8.r2.cloudflarestorage.com',
      },
      // Only allow localhost in development
      ...(isProduction ? [] : [{
        protocol: 'http',
        hostname: 'localhost',
      }]),
    ],
    // Optimize images in production
    minimumCacheTTL: isProduction ? 60 : 0,
  },
  
  // Compression
  compress: true,
  
  // Security
  poweredByHeader: false,
  
  // React
  reactStrictMode: true,
  
  // Production optimizations
  swcMinify: true,
  
  // Output - remove standalone for Vercel compatibility
  // output: 'standalone', // Commented out for Vercel - causes Prisma engine issues
  
  // Ensure Prisma engine binaries are included in Vercel deployment
  // Note: outputFileTracingIncludes may show a warning but still works in Next.js 14.2+
  // Alternative: Use experimental.outputFileTracingIncludes if top-level doesn't work
  ...(process.env.NODE_ENV === 'production' ? {
    outputFileTracingIncludes: {
      '/api/**/*': [
        './node_modules/.prisma/client/**/*',
        './node_modules/@prisma/client/**/*',
      ],
      '/*': [
        './node_modules/.prisma/client/**/*',
        './node_modules/@prisma/client/**/*',
      ],
    },
  } : {}),
  
  // Experimental features
  experimental: {
    // Optimize server components
    optimizePackageImports: ['lucide-react', '@prisma/client'],
  },
  
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client bundle
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      }
    } else {
      // Server-side: Ensure Prisma engine is included (not externalized)
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (external) => typeof external !== 'string' || !external.includes('@prisma')
        )
      }
      
      // Ensure Prisma engine files are not excluded
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    return config
  },
  
}

module.exports = nextConfig




