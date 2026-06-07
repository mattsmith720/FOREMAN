"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { FAQ_ITEMS } from "@/lib/faq-content";

const ITEMS = FAQ_ITEMS;

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
