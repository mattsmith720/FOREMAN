# Foreman (project context)

Read this fully before doing anything. It is the source of truth for the build.

## Mission

Foreman is an AI layer for field work teams, starting with solar installers. A wearable
camera and microphone (Meta smart glasses later, the phone camera now) watch the job as it
happens. The system coaches the worker in real time (sales pitch, install quality, time on
task) and logs the whole job automatically. Every job it sees becomes proprietary data that
makes the system sharper over time. The data is the moat, not the code.

## How we work (this is not optional)

Agile. We ship a working, demoable thing every iteration. We do not plan for months and
ship at the end. Each iteration below ends in something that runs and can be shown to a
customer. Build the smallest thing that proves the next piece of value, then stop and let
the human test it before moving on. Do not build ahead of the roadmap.

## Architecture (the key idea)

The valuable IP is the analysis engine and the data, which live in a backend. Clients are
thin and interchangeable. The camera feed sits behind one interface so the source can be
swapped without touching anything else.

- `FrameSource` interface: produces frames (and later audio) on an interval. Two
  implementations over the life of the project:
  1. Phone web camera (now), via the browser camera API in the web client.
  2. Meta smart glasses (later), via the native app and the Meta toolkit, with MockDeviceKit
     using the phone camera as a stand in during development.
- The pipeline is identical regardless of source: capture, sample a frame, send to the
  backend, get structured coaching back, show it and log it.
- Backend owns: the Claude analysis call, the coaching schema, audio transcription, and all
  persistence. Clients never hold the API key and never call Claude directly.

## Tech stack

- Backend: Node with TypeScript (Fastify or Express). Anthropic SDK for Claude. Endpoints
  for analyse, session start and stop. Validates all model output with zod.
- Web client (the phone prototype, now): Next.js 14 App Router with TypeScript. Uses the
  browser camera and microphone. Deploys to Vercel.
- Native client (the glasses app, later): iOS in Swift with Swift Package Manager, or Android
  in Kotlin with Gradle, integrating the Meta Wearables Device Access Toolkit. Streams to the
  same backend.
- Data, auth, storage: Supabase (Postgres plus storage).
- AI: a vision capable Claude model for frame analysis and coaching. A speech to text service
  for audio transcription.
- Secrets live in environment variables only. Never commit keys. The backend holds
  ANTHROPIC_API_KEY and the Supabase keys.

## Meta Wearables Device Access Toolkit (hard facts, build to these)

These are real constraints. Do not assume otherwise.

- Third party code runs on the paired phone, not on the glasses. The glasses are a capture
  device only (camera and microphone array). Captured media streams to the phone app in real
  time.
- The SDK is native: iOS (Swift) and Android (Kotlin). It supports camera streaming and photo
  capture, plus microphone and speaker access.
- MockDeviceKit lets us build and test with no hardware, using the phone camera or an h265
  video file as a simulated glasses feed. We develop the native app entirely against the mock
  device, then swap in real glasses with no other changes.
- Public app store publishing is gated to select partners during the developer preview.
  Internal testing within our own org is allowed. That is fine for a private pilot.
- There is no "Hey Meta" or Meta AI invocation in the toolkit, and no custom voice commands.
  We can listen for standard events like pause, resume, and stop.
- We bring our own AI (Claude). Data can be processed in the cloud or on device.
- Setup requires a Meta Managed Account and a Wearables Developer Center org, app
  registration, and a device permission flow. Apply for developer preview access early. It
  gates the native phase only, not the phone prototype.
- Live docs for the toolkit are available as an MCP server at
  https://mcp.facebook.com/wearables_dat (tool name search_dat_docs). The GitHub repos are
  facebook/meta-wearables-dat-ios and facebook/meta-wearables-dat-android. Connect the MCP
  when we reach the native phase so you can read the current API rather than guessing.

## Data model (the moat, design for accumulation)

- sessions: id, started_at, ended_at, worker, job_type, notes, summary.
- frames: id, session_id, ts, storage_ref, analysis (jsonb).
- transcript_segments: id, session_id, ts, text, speaker.
- coaching_events: id, session_id, ts, category (pitch, quality, time, safety), message,
  severity.
- labels: id, session_id, key, value. For later model training.

Every job should leave behind a clean, queryable record. This dataset is the asset.

## Conventions

- TypeScript strict mode. Small, single purpose modules.
- The model returns JSON only. Define a zod schema for coaching output and validate every
  response. Reject and retry on invalid output.
- Keep the analysis prompt in its own file so it can be iterated without touching code.
- Write one test for the coaching parser. Keep the rest light early on.
- Lowercase, descriptive file names. Clear names over comments.

## Privacy and safety (real product, real people)

- The system films installers and sometimes customers. Build a clear consent step before any
  capture. Make it obvious recording is happening.
- Treat footage and transcripts as sensitive personal data. Access controlled, never public.
- Confirm consent and data handling fit Australian privacy rules before the live pilot.

## Build roadmap (ship every iteration)

- Iteration 0: backend analyse endpoint. Input a still image plus optional context, output
  validated coaching JSON. Ship: analyse a sample photo from the command line.
- Iteration 1: phone web client. Open on the phone, point the camera, capture a frame every
  few seconds, show live coaching. Ship: live AI commentary on a real scene from the phone.
- Iteration 2: sessions plus Supabase logging plus solar tailored coaching plus an end of job
  summary. Ship: run a mock install, get a summary and stored data.
- Iteration 3: audio capture, transcription, and sales pitch critique. Ship: pitch feedback
  from spoken audio.
- Iteration 4: native app using the Meta toolkit with MockDeviceKit (phone camera as the mock
  glasses feed), streaming to the same backend. Ship: the native app does on the phone what
  the web client did, proving the glasses path end to end.
- Iteration 5: real Meta glasses (once funded). Register the device, swap the mock for the
  real device. Ship: live coaching from the glasses.

## Current focus

Iteration 0 and Iteration 1. Get a working analyse endpoint, then get it live on the phone
camera. Stop after Iteration 1 so the human can test on the phone before we add sessions.

## References

- Meta Wearables Developer Center and the GitHub repos above.
- Meta toolkit docs MCP: https://mcp.facebook.com/wearables_dat
- Anthropic API docs for the vision capable model.
- Next.js, Vercel, Supabase docs.
