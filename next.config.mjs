/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracing: true,
  images: {
    // Thumbnails are pasted into the CMS from anywhere, so an allowlist of hosts
    // turned unknown domains into hard runtime errors instead of a broken image.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
