import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    // The proxy truncates bodies over 10 MB and the settings form then crashes.
    middlewareClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
