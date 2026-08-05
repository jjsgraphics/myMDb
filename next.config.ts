import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }],
  },

  // Nothing gains from announcing the framework and version to every visitor.
  poweredByHeader: false,
};

export default config;
