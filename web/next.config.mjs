/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8080";

const nextConfig = {
  transpilePackages: ["@foreman/shared"],
  async rewrites() {
    return [
      { source: "/api/health", destination: `${backendUrl}/health` },
      { source: "/api/analyse", destination: `${backendUrl}/analyse` },
      { source: "/api/transcribe", destination: `${backendUrl}/transcribe` },
      { source: "/api/sessions/start", destination: `${backendUrl}/sessions/start` },
      {
        source: "/api/sessions/:id/stop",
        destination: `${backendUrl}/sessions/:id/stop`,
      },
      {
        source: "/api/sessions/:id",
        destination: `${backendUrl}/sessions/:id`,
      },
    ];
  },
};

export default nextConfig;
