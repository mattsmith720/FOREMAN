/**
 * Cron worker: ping Render /health every 10 minutes to reduce cold starts.
 * Deploy: cd cloudflare && npx wrangler deploy
 * Replaces or supplements .github/workflows/keep-warm.yml when on Cloudflare.
 */
export default {
  async scheduled(
    _controller: ScheduledController,
    env: { RENDER_HEALTH_URL: string },
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(
      fetch(env.RENDER_HEALTH_URL, { method: "GET" }).then(async (res) => {
        if (!res.ok) {
          console.warn("Render health", res.status);
        }
      }),
    );
  },
};
