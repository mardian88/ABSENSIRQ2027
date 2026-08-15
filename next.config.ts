import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tensorflow/tfjs-node", "@vladmandic/human"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "50mb",
    },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
