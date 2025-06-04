/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true, // Keep or remove based on preference
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Matches any request starting with /api/
        destination: 'http://localhost:3001/api/:path*', // Proxy to Express server
      },
    ];
  },
};

export default nextConfig;
