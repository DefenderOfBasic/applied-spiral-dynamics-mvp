import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  serverComponentsExternalPackages: ["chromadb", "onnxruntime-node"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude native bindings from webpack bundling on server
      config.externals = config.externals || [];
      config.externals.push({
        "onnxruntime-node": "commonjs onnxruntime-node",
      });
      // Mark .node files as external so they're loaded at runtime
      config.externals.push(({ request }:any, callback:any) => {
        if (/\.node$/.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }
    return config;
  },
};

export default nextConfig;
