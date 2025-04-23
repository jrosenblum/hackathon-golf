/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add React strict mode to help catch potential issues
  reactStrictMode: true,
  // Disable ESLint during production build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during production build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable static optimization for all routes to prevent auth-related build issues
  output: 'standalone',
  // Configure which routes are pre-rendered
  experimental: {
    serverComponentsExternalPackages: ['@supabase/auth-helpers-nextjs'],
  },
  // Skip static generation for all routes that require authentication
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig