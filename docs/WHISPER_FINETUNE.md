# Whisper fine-tune prep (Iteration B)

Foreman's first local model win is a **Whisper fine-tune** on solar maintenance and
trade speech (panel cleaning, pigeon proofing, Debris-Block, thermal scans, Brisbane
site jargon) — cheaper and lower-risk than a vision model, and it directly improves
transcript quality (which feeds training module generation and coaching). This doc is
the actionable prep; **no training runs yet** — we gather data and tooling first.

## Why Whisper first

- Off-the-shelf Whisper mis-hears solar maintenance jargon, brand names, and
  Australian trade slang, which corrupts coaching transcripts and training exports.
- A small fine-tune on our own audio + corrected transcripts fixes the worst
  errors for a few dollars of compute.

## Data pipeline

```
sessions/transcript_segments (+ audio_segments when AUDIO_PERSIST=true)
  -> export-training-data.ts        -> training-dataset.jsonl
  -> split-training-data.ts         -> train.jsonl / val.jsonl  (split BY SESSION)
  -> build-whisper-dataset.py       -> whisper-manifest.jsonl   (text side)
  -> [manual] download audio_segments, join on session_id       (audio side)
  -> HuggingFace Whisper fine-tune
```

Commands (from `backend/`):

```bash
npm run export-training       # DB -> exports/training-dataset.jsonl (+ .meta.json)
npm run split-training        # -> exports/train.jsonl, val.jsonl, split-manifest.json
npm run eval-baseline         # quick provenance/volume read before training
python3 scripts/build-whisper-dataset.py \
  --in exports/training-dataset.jsonl --out exports/whisper-manifest.jsonl
```

**Train/val split is BY SESSION** (`split-training-data.ts`) — never random
frames, or near-identical frames from the same job leak the val set and inflate
the score.

## Recommended base model

- Start with **`openai/whisper-small`** (or `whisper-base` for faster/cheaper
  iteration). `small` is the sweet spot for trade vocab on modest GPUs; only go to
  `medium` if WER stays high after a `small` fine-tune.
- Fine-tune with HuggingFace `transformers` + `datasets` (Seq2SeqTrainer), or
  `mlx-whisper` on Apple Silicon for local experiments.
- Keep the original Whisper as the production default until a fine-tune **beats it
  on the held-out val set** (shadow first, promote on eval).

## Solar / trade vocabulary (50 terms)

Bias the decoder / build a domain prompt and a correction lexicon from these:

inverter, microinverter, string inverter, hybrid inverter, PV array, panel,
module, mono PERC, bifacial, tilt frame, rail, mid-clamp, end-clamp, L-foot,
tin roof bracket, tile bracket, standoff, flashing, roof penetration, batten,
purlin, rafter, truss, ridge, eave, fascia, fall arrest, harness, anchor point,
roof anchor, edge protection, exclusion zone, DC isolator, AC isolator,
switchboard, meter box, smart meter, consumer mains, MC4 connector, conduit,
cable tray, earthing, equipotential bonding, string voltage, open-circuit
voltage (Voc), kilowatt (kW), kilowatt-hour (kWh), feed-in tariff, payback
period, STC rebate, battery (e.g. Powerwall, Sungrow), CEC accredited.

(Add brand/model names you actually hear on jobs — they're the highest-value
corrections.)

## Eval metrics

- **WER** (word error rate) overall, and **on held-out PITCH sessions** specifically
  (pitch transcripts drive sales coaching, so their accuracy matters most).
- **Term recall** on the vocabulary above: fraction of solar terms transcribed
  correctly (a domain-weighted accuracy that plain WER understates).
- Baseline first: run `npm run eval-baseline` and transcribe the val set with the
  stock model to record the starting WER, then compare after fine-tuning.

## What not to do yet

- No production swap until a fine-tune wins on the held-out val set.
- No training on Claude-only pseudo-labels for the coaching head — human-verified
  corrections (post-job review) are the asset. Whisper fine-tune is the exception
  because the audio + spoken words are ground truth regardless of coaching labels.
