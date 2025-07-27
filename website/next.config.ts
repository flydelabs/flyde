import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Transpile workspace packages for hot reloads and proper bundling
  transpilePackages: [
    "@flyde/core",
    "@flyde/editor",
    "@flyde/loader",
    "@flyde/nodes"
  ],

  // Configure webpack for Monaco Editor
  webpack: (config, { isServer }) => {
    // Don't bundle Monaco on the server side
    if (!isServer) {
      // Monaco Editor requires special handling
      config.module.rules.push({
        test: /\.ttf$/,
        type: 'asset/resource'
      });
    }
    return config;
  },

  // Configure Turbopack for development
  turbopack: {
    // Enable source maps in development
    resolveAlias: {
      // Ensure proper module resolution for workspace packages
    }
  },
  
  experimental: {
    mdxRs: true
  },
  
  // Configure pageExtensions to include mdx
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],

};

const withMDX = createMDX({
  // Add markdown plugins here, as needed
});

export default withMDX(nextConfig);
