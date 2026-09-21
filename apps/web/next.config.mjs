import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  turbopack: {
    root: path.resolve(process.cwd(), '../..'),
  },

  async redirects() {
    return [
      {
        source: '/what-is-bluecallio',
        destination: '/what-is-purplecallio',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
