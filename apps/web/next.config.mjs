/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

  turbopack: {
    root: '/app',
  },
};

export default nextConfig;
