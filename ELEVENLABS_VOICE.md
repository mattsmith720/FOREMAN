# ElevenLabs voice setup

Foreman uses ElevenLabs for natural Australian male coaching voice and optional live two-way chat.

## Backend env (Render + `backend/.env`)

```bash
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=IKne3meq5aSn9XLyUdCD   # Charlie — Australian male (default)
```

Add `ELEVENLABS_API_KEY` on **Render** (ConvAI live coach) and **Vercel** (cue TTS — Charlie voice). Render datacenter IPs are blocked for ElevenLabs TTS; Vercel synthesizes speech server-side. Keys never go to the browser.

## Render / cloud hosting

ElevenLabs may return **401** for TTS from datacenter IPs (e.g. Render free tier) while ConvAI still works.
**Cue TTS** is handled on **Vercel** (`ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` in Vercel production env) so Charlie (Australian) voice works on the phone.
Render keeps the key for ConvAI signed URLs only.

## What works without extra setup

- **Voice on/off** — ElevenLabs Charlie TTS reads new coaching cues during a job
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

Production needs `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (optional, defaults to Charlie), plus `BACKEND_URL` + `FOREMAN_API_KEY`.

## iPhone tips

- Turn volume up for coaching voice
- Use **Talk to coach** during an active job (session required for Ask mode)
- Live mode pauses job mic capture while connected; it resumes when you close the panel
