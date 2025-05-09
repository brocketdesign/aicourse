/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**', // Allow any path under this hostname
      },
      // Add unsplash.com based on seed script usage
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Allow s47434.pcdn.co for external course images
      {
        protocol: 'https',
        hostname: 's47434.pcdn.co',
      },
      // Add other allowed hostnames here if needed
    ],
  },
  // ... other configurations if they exist
};

module.exports = nextConfig;
