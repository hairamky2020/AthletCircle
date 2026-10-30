import type { NextConfig } from "next";

// Static export: the whole site builds to plain files in out/ and can be hosted free
// (Vercel, Netlify, Cloudflare Pages or GitHub Pages). No server or database needed.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
