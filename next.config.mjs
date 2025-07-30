/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose"],

  eslint: {
    // Allows build even with ESLint errors (not recommended for production)
    ignoreDuringBuilds: true,
  },

  images: {
    domains: ["lh3.googleusercontent.com", "dummyimage.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },

  reactStrictMode: true,
};

export default nextConfig;
