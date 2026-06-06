#!/usr/bin/env python3
"""Build a Whisper fine-tune manifest from an exported Foreman training JSONL.

Foreman's export carries transcript text per session (session_transcripts). Raw
audio lives in the private `audio` bucket when AUDIO_PERSIST=true; download those
separately and join on session_id. This script emits the TEXT side + a manifest
so the audio/text pairs can be assembled for a HuggingFace Whisper fine-tune.

    python3 scripts/build-whisper-dataset.py \
        --in exports/training-dataset.jsonl --out exports/whisper-manifest.jsonl

Standard library only — no pip installs required to produce the manifest.
"""
import argparse
import json
from collections import OrderedDict


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--in", dest="inp", default="exports/training-dataset.jsonl")
    parser.add_argument("--out", dest="out", default="exports/whisper-manifest.jsonl")
    args = parser.parse_args()

    # One entry per session: joined transcript + metadata; audio attached later.
    sessions: "OrderedDict[str, dict]" = OrderedDict()
    with open(args.inp, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            sid = rec.get("session_id", "unknown")
            entry = sessions.setdefault(
                sid,
                {
                    "session_id": sid,
                    "job_type": rec.get("job_type"),
                    "text": "",
                    "audio": None,
                },
            )
            segments = rec.get("session_transcripts") or []
            if segments and not entry["text"]:
                entry["text"] = " ".join(
                    seg.get("text", "").strip()
                    for seg in segments
                    if seg.get("text")
                ).strip()

    written = 0
    with open(args.out, "w", encoding="utf-8") as out:
        for entry in sessions.values():
            if not entry["text"]:
                continue
            out.write(json.dumps(entry, ensure_ascii=False) + "\n")
            written += 1

    print(f"Wrote {written} session transcript entries to {args.out}")
    print(
        "Next: download audio_segments for each session_id, set 'audio' to the "
        "local path, then load as a HuggingFace audio dataset for Whisper "
        "fine-tuning (see docs/WHISPER_FINETUNE.md)."
    )


if __name__ == "__main__":
    main()
