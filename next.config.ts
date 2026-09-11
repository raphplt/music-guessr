import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // Spotify refuses "localhost" as redirect URI, so dev runs on 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  images: { unoptimized: true },
};

export default nextConfig;
