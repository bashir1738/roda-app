import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this package in the monorepo.
  // Otherwise Next can infer /home/bash from an unrelated parent lockfile.
  turbopack: {
    root: __dirname,
  },
  // Webpack mode uses Watchpack. Polling avoids exhausting Linux inotify
  // watchers when the editor or another process already watches the workspace.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 200,
      };
    }
    return config;
  },
};

export default nextConfig;
