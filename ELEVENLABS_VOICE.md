# ElevenLabs voice setup

Foreman uses ElevenLabs for natural Australian male coaching voice and optional live two-way chat.

## Backend env (Render + `backend/.env`)

```bash
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=IKne3meq5aSn9XLyUdCD   # Charlie — Australian male (default)
```

Add the same `ELEVENLABS_API_KEY` on **Render** (not Vercel). The web app proxies through the backend — the key never goes to the browser.

## Render / cloud hosting

ElevenLabs may return **401** for TTS from datacenter IPs (e.g. Render free tier) while ConvAI still works.
The backend falls back to **OpenAI TTS** (`OPENAI_API_KEY`, already used for Whisper) when ElevenLabs TTS fails.
For native Charlie voice on Render, use a paid ElevenLabs plan or host the API outside a blocked IP range.

## What works without extra setup

- **Voice on/off** — ElevenLabs TTS (or OpenAI TTS fallback) reads new coaching cues during a job
- **Talk to coach → Ask Foreman** — hold button, speak, Claude answers, ElevenLabs speaks the reply

## Live ElevenLabs ConvAI (optional)

For real-time back-and-forth voice (no hold button):

1. In [ElevenLabs Agents](https://elevenlabs.io/app/agents), create an agent with a Foreman system prompt (solar install coach, Australian tone, practical advice).
2. Under **Security**, enable **Signed URL** authentication (recommended for production).
3. Add your site to the allowlist if you use hostname auth instead: `foreman-phi.vercel.app`
4. Copy the **Agent ID** and set on Render:

```bash
ELEVENLABS_AGENT_ID=agent_xxxxxxxx
```

5. Redeploy Render. The app will show **Live (ElevenLabs)** in Talk to coach.

## Vercel

No ElevenLabs keys on Vercel. Only `BACKEND_URL` + `FOREMAN_API_KEY` as today.

## iPhone tips

- Turn volume up for coaching voice
- Use **Talk to coach** during an active job (session required for Ask mode)
- Live mode pauses job mic capture while connected; it resumes when you close the panel
