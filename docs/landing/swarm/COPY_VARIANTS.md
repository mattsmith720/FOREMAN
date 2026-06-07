# Landing copy variants — A28

**Source of truth:** `landing/app/page.tsx` (deployed at https://landing-lac-mu.vercel.app)  
**Locale:** Australian English  
**Constraints:** Truthful only — no fabricated stats, logos, testimonials, or CER endorsement. See `docs/landing/TRUTH_AUDIT.md`.

---

## Current baseline (do not delete — reference for A/B picks)

| Slot | Current copy |
|------|--------------|
| Pilot badge | Built on the roof with real install crews |
| Hero H1 | Compliance execution for solar install crews |
| Hero sub | Voice-guided evidence, live defect coaching, and submission packs — built around how crews actually work on a roof. |
| Primary CTA | Book a demo (via `BookDemo`) |
| Secondary CTA | Watch it run a job |
| Pain section title | Solar compliance shouldn't be this hard |
| Pain section lede | Photos get lost. Labels get missed. One unclear shot spirals into a failed claim and a return trip. |
| Final CTA H2 | Ready to stop losing claims to paperwork? |
| Final CTA button | Book a demo |

---

## Hero headline — 3 options

Pick one H1. Subheads are optional pairings; all three subs stay aligned with verified product capabilities (voice-guided shots, live coaching, submission packs).

### Option H1 — **Keep the frame, sharpen the verb** *(closest to live)*

**Headline:** Compliance execution for solar install crews

**Sub (unchanged):** Voice-guided evidence, live defect coaching, and submission packs — built around how crews actually work on a roof.

**Why:** Already on page. Clear B2B positioning. No metrics. “Execution” signals doing, not documenting.

---

### Option H2 — **Outcome on the roof**

**Headline:** Get every CER shot right — while you're still on the roof

**Sub:** Foreman prompts each required photo, catches defects in the moment, and hands your crew lead a submission-ready pack at job end.

**Why:** Leads with the installer’s immediate win (on-roof, not back-office). “CER shot” is accurate to the guided shot list; avoid implying regulator endorsement (footer disclaimer still required).

---

### Option H3 — **Crew-first, paperwork-last**

**Headline:** The compliance layer your install crew actually uses

**Sub:** Voice-guided evidence, live defect coaching, and one-tap submission packs — on the phone already in their pocket.

**Why:** Mirrors solution-section kicker (“The compliance layer for your crew”) for narrative continuity. “Actually uses” differentiates from shelf-ware checklists; phone-first is verified (no glasses required).

---

## Final CTA — 3 options

Each option is the closing H2 only; button stays **Book a demo** unless noted.

### Option C1 — **Keep live copy** *(default)*

**Headline:** Ready to stop losing claims to paperwork?

**Why:** Direct pain → action. “Paperwork” is broad but honest (photos, labels, packs). No numbers.

---

### Option C2 — **Pilot invitation**

**Headline:** See Foreman on a live install — book a demo

**Sub (optional, below H2):** We're piloting with Brisbane solar crews. Walk through a job on the phone with your crew lead.

**Why:** Sets expectation (demo, not self-serve signup). Brisbane pilot is configurable via `NEXT_PUBLIC_PILOT_BADGE` / announcement strip — align env before shipping.

**Button tweak (optional):** Book your demo walkthrough

---

### Option C3 — **Evidence-pack close**

**Headline:** Ready for submission-ready packs on every job?

**Sub (optional):** Voice-guided capture, live coaching, and a branded evidence pack your crew lead can forward — without chasing five camera rolls.

**Why:** Ties to verified one-tap pack feature. Echoes pain card “Camera-Roll Chaos” without repeating it verbatim.

---

## Pain cards — copy tweaks

Section title and lede are fine as-is. Below: **title + body** alternatives per card. All keep Australian framing; dollar example stays illustrative (typical STC value), not a guarantee.

### Card 1 — Failed Claims

| | Copy |
|---|------|
| **Live** | **Failed Claims** — One missing shutdown-label photo holds up a $3,000 rebate. |
| **Tweak A** | **Rebate held up** — One missing shutdown-label photo can delay STCs worth thousands — and the cash flow that goes with them. |
| **Tweak B** | **Failed claims** — A single unclear label shot can stall your STC claim while the customer waits. |

**Notes:** Tweak A softens the fixed “$3,000” (TRUTH_AUDIT: framed example). Tweak B removes dollar figure entirely if operator prefers maximum caution.

---

### Card 2 — Camera-Roll Chaos

| | Copy |
|---|------|
| **Live** | **Camera-Roll Chaos** — Your evidence lives across five phones and a WhatsApp thread. |
| **Tweak A** | **Scattered evidence** — Photos sit on five phones, a group chat, and someone's camera roll from last Tuesday. |
| **Tweak B** | **No single source of truth** — When the auditor asks for the inverter serial shot, nobody's sure which phone has it. |

**Notes:** “Five phones” is illustrative, not a measured stat — same honesty bar as live copy. Tweak B is more scene-specific for crew leads.

---

### Card 3 — The Regulator Checks With AI

| | Copy |
|---|------|
| **Live** | **The Regulator Checks With AI** — The CER reviews every photo with AI. Unclear shots get rejected. |
| **Tweak A** | **AI scrutiny on every photo** — CER evidence is reviewed with increasing automation. Blurry or incomplete shots don't pass. |
| **Tweak B** | **Unclear shots don't pass** — Regulators expect legible, complete photo evidence — and reject what doesn't meet the bar. |

**Notes:** Live copy is strong but assertive on CER process. Tweaks A/B stay truthful without claiming insider knowledge of CER tooling; prefer B if legal wants less specificity on “AI reviews every photo.”

---

### Card 4 — Found Out at Claim Time

| | Copy |
|---|------|
| **Live** | **Found Out at Claim Time** — Defects surface weeks later — back on the roof you go. |
| **Tweak A** | **Found out too late** — A missed label or serial mismatch surfaces at claim time — and you're booking a return visit. |
| **Tweak B** | **The callback crew** — What the installer didn't catch on the roof becomes a defect ticket — and another trip. |

**Notes:** Aligns with feature copy (“not weeks later at claim time”). No invented callback rates.

---

## Recommended combinations (integrator hints)

| Goal | Hero | Final CTA | Pain tweaks |
|------|------|-----------|-------------|
| Minimal diff | H1 | C1 | Live only |
| Strongest product proof | H2 | C3 | Cards 2→B, 4→A |
| Pilot / demo funnel | H3 | C2 | Card 1→B, 3→B |

---

## Spelling & voice checklist

- Australian English: **organise**, **centre**, **licence** (noun), **programme** only where appropriate; product terms (demo, install) unchanged.
- Em dash with spaces — matches live page.
- No “guaranteed”, “always”, “100%”, or invented fleet sizes.
- CER / regulator: requirements and evidence language only — never endorsement.

---

*Agent A28 · read-only on code · for LP-A20 integrator or operator pick*
