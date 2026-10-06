/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@music/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'creatornode.audius.co',
      },
      {
        protocol: 'https',
        hostname: '**.audius.co',
      },
      {
        protocol: 'https',
        hostname: 'audius-nodes.com',
      },
      {
        protocol: 'https',
        hostname: '**.audius-nodes.com',
      },
      {
        protocol: 'https',
        hostname: '**.figment.io',
      },
      {
        protocol: 'https',
        hostname: '**.theblueprint.xyz',
      },
      {
        protocol: 'https',
        hostname: '**.monophonic.digital',
      }
    ],
  },
  async rewrites() {
    const apiTarget = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${apiTarget}/health`,
      }
    ];
  },
};

export default nextConfig;
