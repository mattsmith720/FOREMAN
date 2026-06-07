/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@foreman/shared"],
  eslint: {
    // Lint runs as its own gate (npm run lint / CI), decoupled from the
    // production build so a lint finding can never block a deploy.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
