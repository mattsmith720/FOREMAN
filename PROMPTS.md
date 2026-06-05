# Foreman build prompts

Paste these into Claude Code one at a time, in order. After each one, run it and test the
result on your phone or machine before moving to the next. Claude Code reads CLAUDE.md
automatically, so you do not need to repeat the context. Ship after every prompt.

Run a parallel task now, before you reach prompt 5: apply for the Meta Wearables Device
Access Toolkit developer preview through the Meta Wearables Developer Center interest form.
Access gates the native glasses phase, not the phone prototype, so the early prompts do not
wait on it.

---

## Prompt 0: project setup

Set up the repository as described in CLAUDE.md. Create a backend folder (Node and
TypeScript, Fastify) and a web folder (Next.js 14 App Router and TypeScript), plus a shared
types module for the coaching schema. Initialise git, package files, tsconfig, and a .env
example for the backend with ANTHROPIC_API_KEY and the Supabase keys. Add the FrameSource
interface as a stub in the shared module. Do not write feature logic yet. Show me the final
folder structure and tell me how to install everything.

---

## Prompt 1: the analyse endpoint (Iteration 0)

Build the backend analyse endpoint. It accepts a base64 image and optional session context,
calls the vision capable Claude model through the Anthropic SDK, and returns coaching as
JSON validated with zod. The coaching shape: an array of observations, install quality
flags, sales pitch feedback, and a short note on time on task. Keep the model prompt in its
own file so I can tune it. Add a small script that sends a local sample image to the endpoint
and prints the result, so I can test from the command line. Tell me how to run it.

---

## Prompt 2: live on my phone (Iteration 1)

Build the Next.js web client so I can open it on my phone and see it work. It should request
camera permission, show the live camera, capture a frame every four seconds, send it to the
analyse endpoint, and display the latest coaching on screen as a clean readable overlay. Add
Start and Stop buttons and a simple status indicator. Keep the Claude key on the backend, the
browser only talks to our backend. Make it ready to deploy to Vercel. Then give me exact step
by step instructions to run the backend and the web client locally and open the page on my
phone over the same network.

Stop here so I can test on my phone before we continue.

---

## Prompt 3: sessions, logging, and solar coaching (Iteration 2)

Add a job session concept. A Start Job begins a session, every frame and coaching event is
tied to it, and a Stop Job ends it and produces a plain language summary of the job. Persist
sessions, frames, transcript segments, coaching events, and labels to Supabase using the data
model in CLAUDE.md. Tune the analysis prompt for solar installation coaching: time on task,
install quality and safety flags, and clear next steps. Show me the session summary and
confirm the data is stored.

---

## Prompt 4: audio and pitch critique (Iteration 3)

Add microphone capture in the web client and audio transcription in the backend using a
speech to text service. Feed the transcript into the analysis so the system can critique the
sales pitch on a door knock and suggest stronger lines. Add pitch feedback to the session
summary. Tell me how to test it by speaking a mock pitch.

---

## Prompt 5: native app with the Meta toolkit and mock device (Iteration 4)

We are now building the glasses path. First, connect the Meta toolkit docs MCP at
https://mcp.facebook.com/wearables_dat so you can read the current API. Then scaffold a native
app (start with whichever matches my phone, iOS in Swift or Android in Kotlin) that integrates
the Meta Wearables Device Access Toolkit. Use MockDeviceKit with the phone camera as the mock
glasses feed. Stream frames to the same backend analyse endpoint we already built, and show
the coaching in the app. The goal is to prove the exact glasses pipeline using the mock device,
with no change to the backend. Walk me through any Meta developer account and app registration
steps I need to do.

---

## Prompt 6: real glasses (Iteration 5, once funded)

Switch the native app from the mock device to real Meta glasses. Walk me through registering
the device and the permission flow, then swap the mock feed for the live glasses feed. Nothing
else in the pipeline should change. Confirm we get live coaching from the glasses.

---

## How to drive it after this

Keep prompts small and single purpose. When something is wrong, tell Claude Code exactly what
you saw. When you want a rule to stick across sessions, add it to CLAUDE.md rather than only
saying it in chat. Test on the phone after every shippable step.
