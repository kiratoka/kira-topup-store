/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;