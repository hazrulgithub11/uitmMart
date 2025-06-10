import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com'],
  },
  output: 'standalone'
};

export default nextConfig;
