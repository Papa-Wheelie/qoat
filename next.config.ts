import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/feed",
        destination: "/browse",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
