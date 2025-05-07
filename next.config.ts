/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Mencegah clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Mencegah MIME-type sniffing
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Enforce HTTPS
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Lebih ketat daripada origin-when-cross-origin
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()', // Batasi permission + blokir FLoC
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'; form-action 'self';", // CSP penting untuk nilai A
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Proteksi XSS tambahan untuk browser lama
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on', // Meningkatkan performa dengan pre-fetching DNS
          },
        ],
      },
    ];
  },

  // Enable mdx support
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Optimasi tambahan
  poweredByHeader: false, // Hilangkan header X-Powered-By
  reactStrictMode: true, // Aktifkan Strict Mode
};

export default nextConfig;