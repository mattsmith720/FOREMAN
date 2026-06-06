/**
 * Process queued site videos (pending uploads / Drive sync).
 *
 * Requires ffmpeg on PATH. Run on a machine with backend/.env configured:
 *
 *   cd backend && npm run process-videos
 *
 * On Render (no ffmpeg), run this locally or on a cron host after tradie uploads.
 */
import "dotenv/config";
import { listPendingSiteVideos } from "../src/db/site-videos.js";
import { processSiteVideo } from "../src/process-site-video.js";

async function main() {
  const pending = await listPendingSiteVideos(25);

  if (pending.length === 0) {
    console.log("No pending site videos.");
    return;
  }

  console.log(`Processing ${pending.length} site video(s)...`);

  for (const video of pending) {
    console.log(`→ ${video.id} (${video.file_name ?? "unnamed"})`);
    const result = await processSiteVideo(video.id);
    console.log(
      `  ${result.status} — session ${result.session_id ?? "n/a"}, frames ${result.frames_extracted}`,
    );
    if (result.error_message) {
      console.log(`  error: ${result.error_message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
