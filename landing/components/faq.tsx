"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "What is Foreman?",
    a: "Foreman is an AI compliance and coaching layer for solar installs. It runs on the phone already in your installer's pocket — guiding evidence capture and catching defects while the crew is still on the roof.",
  },
  {
    q: "Do I need smart glasses?",
    a: "No. Foreman is phone-first today. Meta smart glasses support is coming for fully hands-free capture, but everything in the pilot works on a standard smartphone.",
  },
  {
    q: "Is my data secure?",
    a: "Recording is consent-first on every job. Evidence is encrypted in transit and stored in access-controlled systems — not public, not shared for advertising. Final privacy wording is reviewed with your operator before wider rollout.",
  },
  {
    q: "What does it cost?",
    a: "Per-installer monthly seats. Pilot pricing is discussed on the demo call — we don't publish a list price until your fleet size and workflow are scoped.",
  },
  {
    q: "How do we get started?",
    a: "Book a demo and we'll walk your crew lead through a live job on the phone. Most pilots start with one install team and expand once packs are passing first time.",
  },
] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="lp-faq">
      {ITEMS.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.q} className="lp-faq-item">
            <button
              type="button"
              className="lp-faq-trigger"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : index)}
            >
              {item.q}
              <span aria-hidden="true">{expanded ? "−" : "+"}</span>
            </button>
            {expanded && <div className="lp-faq-panel">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
