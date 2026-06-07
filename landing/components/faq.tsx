"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const ITEMS = [
  {
    q: "What is Foreman?",
    a: "Foreman is an AI layer for solar maintenance crews. It runs on the phone during real jobs, coaches technique and safety on the roof, and turns visit footage into structured training data and onboarding modules.",
  },
  {
    q: "How does this help SolarShield scale?",
    a: "Your best techs record gold-standard visits once. Foreman extracts steps, safety notes, and common mistakes into training packages new hires follow · without the owner on every roof.",
  },
  {
    q: "Do I need smart glasses?",
    a: "No. Foreman is phone-first today. Meta smart glasses support is coming for fully hands-free capture, but the pilot runs on a standard smartphone.",
  },
  {
    q: "What happens to our video footage?",
    a: "Frames, audio, and transcripts are stored in your private Foreman dataset. You can export for Whisper fine-tuning and future proprietary model training. Data is not public and not used for advertising.",
  },
  {
    q: "Is my data secure?",
    a: "Recording is consent-first on every job. Evidence is encrypted in transit and stored in access-controlled systems. Final privacy wording is reviewed with your operator before wider rollout.",
  },
  {
    q: "What does it cost?",
    a: "Per-tech monthly seats. Pilot pricing is discussed on the demo call. We scope fleet size and workflow before quoting.",
  },
  {
    q: "What's included in the pilot?",
    a: "Typically 2 to 3 techs on real maintenance jobs via the phone app, video ingest for existing footage, live coaching, training module generation, and end-of-job summaries. No long-term contract.",
  },
  {
    q: "How do we get started?",
    a: "Book a demo. We upload a few existing job videos, run one live visit, and generate the first onboarding module from your best tech's footage.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const toggle = useCallback((index: number) => {
    setOpen((current) => (current === index ? null : index));
  }, []);

  const focusTrigger = useCallback((index: number) => {
    triggerRefs.current[index]?.focus();
  }, []);

  const onTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = ITEMS.length - 1;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusTrigger(index === last ? 0 : index + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusTrigger(index === 0 ? last : index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusTrigger(0);
          break;
        case "End":
          event.preventDefault();
          focusTrigger(last);
          break;
        default:
          break;
      }
    },
    [focusTrigger],
  );

  return (
    <div className="lp-faq">
      {ITEMS.map((item, index) => {
        const expanded = open === index;
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.q} className="lp-faq-item">
            <button
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              type="button"
              id={triggerId}
              className="lp-faq-trigger"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => toggle(index)}
              onKeyDown={(event) => onTriggerKeyDown(event, index)}
            >
              {item.q}
              <span aria-hidden="true">{expanded ? "−" : "+"}</span>
            </button>
            {expanded && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="lp-faq-panel"
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
