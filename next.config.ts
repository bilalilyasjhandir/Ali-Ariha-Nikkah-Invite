import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every image is a hand-tuned WebP already sized for its slot, so serve
    // the files as-is: re-encoding only softens the paper and wax textures,
    // and it keeps the site clear of Vercel's image-optimisation quota.
    unoptimized: true,
  },
};

export default nextConfig;
