# Maintenance pilot · Foreman

**Focus:** Brisbane solar maintenance crews  
**Primary value:** Turn field video into proprietary training data and auto-built onboarding packages  
**Status:** Private pilot

---

## What the owner wants

> Data trained from the videos goes into the AI model we run, so it trains our own proprietary model on this video footage and automatically makes training packages for new joining team members — so he doesn't have to train them up.

Foreman delivers that loop:

1. **Record** real maintenance visits (live on phone or upload existing footage)
2. **Accumulate** frames, audio, transcripts, and coaching labels in a private dataset
3. **Export** for Whisper fine-tune and future vision model training
4. **Generate** onboarding modules (steps, safety, quiz, briefing script) from any completed session

---

## Maintenance services in Foreman

| Job type in app | Service |
|-----------------|---------|
| `panel_clean` | Solar panel cleaning, Debris-Block, annual plans |
| `pigeon_proofing` | Nest removal, mesh, repellent |
| `thermal_scan` | Thermal imaging, hotspot reports |
| `exterior_clean` | Gutters, skylights, soft wash |
| `commercial_clean` | Commercial solar cleaning |

---

## Pilot phases

### Phase 1 · Ingest (week 1)

- Upload 3 to 5 gold-standard videos per service type from camera roll
- Tag worker name and job type on `/ingest`
- Confirm labels on a few key frames (human verification)
- Run `npm run export-training` in `backend/` for first dataset snapshot

### Phase 2 · Live visits (week 2)

- 2 to 3 techs run Foreman on phone during real Brisbane jobs
- Voice coaching for safety and technique (quiet, action-first cues)
- End-of-job summary for office / crew lead review

### Phase 3 · Training modules (week 3)

- Generate first modules from completed sessions: `/training` in web app
- Owner reviews once; iterate prompts from feedback
- New hires follow generated steps + quiz before solo visits

### Phase 4 · Model training (ongoing)

- Whisper fine-tune on crew audio (see `docs/WHISPER_FINETUNE.md`)
- Vision labels accumulate session by session
- Continual export via `scripts/training-pipeline.sh`

---

## Operator URLs

| Surface | URL |
|---------|-----|
| Web coach + ingest | https://foreman-phi.vercel.app |
| Training module generator | https://foreman-phi.vercel.app/training |
| Landing | https://landing-lac-mu.vercel.app |
| API | https://foreman-api-y31r.onrender.com |

---

## API · training module

```http
POST /sessions/:id/training-module
Authorization: Bearer <session-token>
```

Returns structured JSON:

- `title`, `summary`, `learningObjectives`
- `steps[]` with `safetyNote`, `commonMistake`
- `quizQuestions[]`, `onboardingScript`

Requires a session with frames or transcript (from live job or ingest).

---

## Success metrics

| Metric | Target |
|--------|--------|
| Sessions ingested per service type | ≥ 3 gold-standard videos each |
| Training modules generated | ≥ 1 per core service (panel clean, pigeon proofing) |
| Owner time on new-hire shadowing | Measurable reduction by week 4 |
| Export row count | Growing week on week |

---

## Privacy

- Consent overlay before any capture (AU wording)
- `pilot_90d` retention default until legal sign-off
- Operator data isolated; not mixed with other crews without consent

---

## What we are not promising in this pilot

- Fully automated model training (export + manual fine-tune steps first)
- Customer-facing branded PDF packs (modules are web/JSON today)
- Smart glasses (phone-first; glasses path unchanged on roadmap)
- Install / CER compliance (maintenance focus only)
