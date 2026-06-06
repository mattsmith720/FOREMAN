"use client";

import { useEffect, useState } from "react";
import { confirmLabel, getSessionReview, type ReviewItem } from "../lib/review";

type ItemState = "open" | "saving" | "confirmed" | "corrected";

/**
 * 30-second post-job review: the worker confirms or corrects the top coaching
 * calls, turning Claude pseudo-labels into human-verified training signal.
 * Renders nothing if the review can't load (never blocks the summary).
 */
export function PostJobReview({ sessionId }: { sessionId: string }) {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [states, setStates] = useState<Record<number, ItemState>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const review = await getSessionReview(sessionId);
        if (!cancelled) {
          setItems(review.items);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!items || items.length === 0) {
    return null;
  }

  const setState = (index: number, state: ItemState) =>
    setStates((current) => ({ ...current, [index]: state }));

  const confirm = async (index: number, item: ReviewItem) => {
    setState(index, "saving");
    try {
      await confirmLabel({
        sessionId,
        key: item.category,
        value: item.message,
      });
      setState(index, "confirmed");
    } catch {
      setState(index, "open");
    }
  };

  const correct = async (index: number, item: ReviewItem) => {
    const fixed = window.prompt(
      "What should the coaching have said?",
      item.message,
    );
    if (!fixed || !fixed.trim()) {
      return;
    }
    setState(index, "saving");
    try {
      await confirmLabel({
        sessionId,
        key: item.category,
        value: item.message,
        correctedValue: fixed.trim(),
      });
      setState(index, "corrected");
    } catch {
      setState(index, "open");
    }
  };

  return (
    <section className="review-panel">
      <h3>Was the coaching right?</h3>
      <p className="review-sub">A quick check helps Foreman learn (~30s).</p>
      <ul className="review-list">
        {items.map((item, index) => {
          const state = states[index] ?? "open";
          return (
            <li
              key={`${item.category}-${index}`}
              className={`review-item sev-${item.severity}`}
            >
              <span className="review-cat">{item.category}</span>
              <span className="review-msg">{item.message}</span>
              {state === "confirmed" ? (
                <span className="review-done">✓ Confirmed</span>
              ) : state === "corrected" ? (
                <span className="review-done">✓ Corrected</span>
              ) : (
                <span className="review-actions">
                  <button
                    type="button"
                    className="button button-secondary review-btn"
                    disabled={state === "saving"}
                    onClick={() => void confirm(index, item)}
                  >
                    👍 Right
                  </button>
                  <button
                    type="button"
                    className="button button-secondary review-btn"
                    disabled={state === "saving"}
                    onClick={() => void correct(index, item)}
                  >
                    Fix
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
