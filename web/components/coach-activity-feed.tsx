"use client";

import {
  ACTIVITY_KIND_LABELS,
  type ActivityItem,
} from "../lib/activity-feed";

interface CoachActivityFeedProps {
  items: ActivityItem[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function CoachActivityFeed({ items }: CoachActivityFeedProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="coach-activity" aria-label="Live activity">
      <p className="coach-activity-title">Live feed</p>
      <ul className="coach-activity-list">
        {items
          .slice()
          .reverse()
          .map((item) => (
            <li key={item.id} className={`coach-activity-item kind-${item.kind}`}>
              <span className="coach-activity-kind">
                {ACTIVITY_KIND_LABELS[item.kind]}
              </span>
              <span className="coach-activity-msg">{item.message}</span>
              <span className="coach-activity-time">{formatTime(item.ts)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
