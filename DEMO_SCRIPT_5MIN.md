# Foreman — 5-minute verbatim demo script

**URL:** [https://foreman-phi.vercel.app/](https://foreman-phi.vercel.app/) *(root — `/demo` not merged; use `/`)*  
**Audience:** Blake / investor · live on iPhone Safari  
**Audit metrics (if asked):** [docs/swarm/TRUST_AUDIT.md](docs/swarm/TRUST_AUDIT.md) — **73** backend tests, **65** web tests, **6** guided compliance shots, prod smoke **PASS**, eval **31/31** on **6/11** scored scenarios.

---

## Before you start (not counted in 5 min)

Wake the API if idle:

```bash
curl https://foreman-api-y31r.onrender.com/health
curl https://foreman-phi.vercel.app/api/health
```

Both should return `{"status":"ok"}`. First request after sleep may take 30–60s — the app shows **Waking Foreman…** and retries.

**Device:** iPhone, Safari (not in-app browser). Volume up if you want cue voice.

---

## 0:00 — Open and frame the product

**[ACTION]** Open Safari → `https://foreman-phi.vercel.app/`

**SAY (verbatim):**

> "This is Foreman — an AI coaching layer for solar installers. Your phone camera and mic watch the job. Claude analyses what you see every few seconds and coaches you live. Every frame, transcript, and coaching event logs to our database. That's the moat — the data from every job makes the system sharper."

---

## 0:30 — Consent and job setup

**[ACTION]** On the boot screen, read the consent copy briefly. Select **Install**. Optionally type a name.

**SAY:**

> "Before anything records, we show Australian privacy consent — everyone in frame has to be OK with it. I'm picking Install because that's where we guide six compliance shots and build a geo-stamped evidence pack at the end. Trust audit verified those six guided shots and the ZIP export."

**[ACTION]** Tap **I understand — start coaching**. Allow camera and microphone when Safari prompts.

**SAY:**

> "One tap — consent, unlock audio, start the job. You'll see a red REC badge when we're live."

---

## 1:00 — Live coaching loop

**[ACTION]** Point the camera at something with structure (desk gear, window/roof line, or a printed switchboard photo). Pan slowly.

**SAY:**

> "Watch the status pill — it cycles Live, then Analyzing. Every few seconds Claude returns structured coaching. The hero card shows the top cue — safety in red, quality in amber. Tap the card to cycle through all cues for this frame."

**[ACTION]** Wait for at least one **Analyzing…** → hero card update. Optionally tap the hero card once to show `2/5` style cycling.

**SAY:**

> "Under the hood we've got seventy-three backend tests and sixty-five web tests passing, and production smoke is PASS per our June trust audit. This isn't a slide deck — it's deployed."

**[ACTION]** Tap **Details**. Briefly show **Seeing**, **Advice**, **Marks**. Close the sheet.

---

## 1:45 — Voice and pitch critique

**SAY (clearly into the mic):**

> "Installing rail brackets on the north roof. Checking the fall-protection anchor. Customer asked about payback — quoted about thirty percent off the power bill."

**[ACTION]** Open **Details** → **Heard** (transcript) and **Advice → Pitch & upsell**.

**SAY:**

> "Whisper transcribes what I say. Claude folds that into pitch critique — strongest if I'd picked Pitch phase, but Install still hears me. On scored eval scenarios we're thirty-one for thirty-one on the rubric — that's one hundred percent on the six scenarios we grade today; we're explicit that full eleven-scenario coverage is still in flight."

---

## 2:30 — Compliance evidence pack (Install)

**SAY:**

> "On Install, Foreman voice-prompts six CER shots in sequence — setup selfie, meter box, switchboard label, inverter serial plate, battery labels, testing selfie. Each good capture gets a geo and timestamp burned into the JPEG."

**[ACTION]** If prompts appear, capture one or two shots (meter box, switchboard label, or any available step). If you're indoors, say you're simulating and skip — do not claim shots you didn't take.

**SAY (if simulating):**

> "On a real roof you'd walk all six — audit verified the guided flow and ZIP pack. I'm simulating indoors; the flow is the same on site."

---

## 3:15 — Pause and resume (optional 15s)

**[ACTION]** Tap **Pause job** → show amber **PAUSED** → **Resume job**.

**SAY:**

> "Pause suspends capture without killing the session — useful when the customer asks you to stop filming."

---

## 3:30 — End job, summary, data moat

**[ACTION]** Tap **End job**. Wait for **Summarising…** → **Job complete** panel.

**SAY:**

> "End job triggers a Claude summary and shows stored counts — frames, coaching events, labels, transcript segments. That's the proof the job landed in Postgres, not just pretty UI."

**[ACTION]** Scroll to **Was the coaching right?** Tap **👍 Right** on one cue.

**SAY:**

> "Installer feedback on cues feeds our training loop. Every job adds frames with analysis JSON, transcript segments, and labels — proprietary data competitors can't buy."

**[ACTION]** If you captured compliance shots: confirm `foreman-evidence-*.zip` downloaded (or JSON manifest fallback). Hold phone briefly toward audience.

**SAY:**

> "On a real install you get a foreman-evidence ZIP — stamped JPEGs plus manifest. Audit verified the pack; PDF report and serial OCR are Program B — we're not claiming those today."

---

## 4:30 — Close and Q&A hooks

**SAY:**

> "Recap: live AI coaching on the phone, automatic job log, six-shot compliance evidence on Install, production deployed with smoke PASS. Partial today: full eval coverage is six of eleven scenarios, ops latency dashboard needs operator password, iOS glasses path is modeled but build-unverified. Next step is a crew pilot on real jobs, then Blake dashboard and PDF pack. Questions?"

**[ACTION]** Tap **Start new job** only if you have spare time; otherwise stop at 5:00.

---

## If something breaks (say this, don't panic)

| Symptom | SAY |
|---------|-----|
| **Waking Foreman…** stuck 30–60s | "Render free tier cold start — first request after idle. It auto-retries." |
| No coaching / 0 frames at end | "API was still waking — we'd retry after health is green." |
| No transcript | "Mic permission or chunk timing — vision coaching still works." |
| No ZIP | "ZIP only when at least one compliance shot captured — JSON fallback otherwise." |

---

## Metrics cheat sheet (TRUST_AUDIT only)

| Metric | Value |
|--------|------:|
| Backend tests | 73 |
| Web tests | 65 |
| Guided compliance shots | 6 |
| Eval scenarios scored | 6/11 (54.5%) |
| Eval rubric pass (scored) | 31/31 (100%) |
| Prod smoke | PASS |
| Analyse cost model (prod) | $0.015 / frame |

*Source: [docs/swarm/TRUST_AUDIT.md](docs/swarm/TRUST_AUDIT.md), audit date 2026-06-07.*
