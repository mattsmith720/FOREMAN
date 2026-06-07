/** @type {import('next').NextConfig} */
const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL?.trim();

const nextConfig = {
  transpilePackages: ["@foreman/shared"],
  async redirects() {
    if (!marketingUrl) {
      return [];
    }
    return [
      {
        source: "/welcome",
        destination: marketingUrl,
        permanent: true,
      },
    ];
  },
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
