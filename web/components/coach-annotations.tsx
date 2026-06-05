"use client";

import type { VisualCallout } from "@foreman/shared";

interface CoachAnnotationsProps {
  callouts: VisualCallout[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const CATEGORY_COLORS: Record<VisualCallout["category"], string> = {
  quality: "#38bdf8",
  safety: "#ef4444",
  pitch: "#a78bfa",
  upsell: "#22c55e",
  cleanliness: "#fbbf24",
  damage: "#f97316",
  time: "#94a3b8",
};

function calloutKey(callout: VisualCallout, index: number): string {
  return callout.id ?? `${callout.label}-${index}`;
}

export function CoachAnnotations({
  callouts,
  activeIndex,
  onSelect,
}: CoachAnnotationsProps) {
  if (callouts.length === 0) {
    return null;
  }

  return (
    <svg
      className="coach-annotations"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {callouts.map((callout, index) => {
        const color = CATEGORY_COLORS[callout.category];
        const isActive = index === activeIndex;
        const cx = callout.x * 100;
        const cy = callout.y * 100;
        const rw = (callout.w ?? 0.14) * 50;
        const rh = (callout.h ?? callout.w ?? 0.14) * 50;
        const labelY = cy < 18 ? cy + rh + 8 : cy - rh - 4;

        return (
          <g
            key={calloutKey(callout, index)}
            className={`annotation-group ${isActive ? "active" : ""}`}
            onClick={() => onSelect(index)}
            style={{ cursor: "pointer", color }}
          >
            {callout.shape === "box" ? (
              <rect
                x={cx - rw}
                y={cy - rh}
                width={rw * 2}
                height={rh * 2}
                rx={1.2}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? 0.55 : 0.35}
                className="annotation-shape"
              />
            ) : callout.shape === "pointer" ? (
              <>
                <circle cx={cx} cy={cy} r={1.8} fill={color} className="annotation-dot" />
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + rw * 1.4}
                  y2={cy - rh * 1.2}
                  stroke={color}
                  strokeWidth={0.35}
                />
              </>
            ) : (
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(rw, rh)}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? 0.55 : 0.35}
                className="annotation-shape"
              />
            )}

            {isActive && (
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(rw, rh) + 2}
                fill="none"
                stroke={color}
                strokeWidth={0.2}
                className="annotation-pulse"
              />
            )}

            <g className="annotation-label" transform={`translate(${cx}, ${labelY})`}>
              <rect
                x={-14}
                y={-3.2}
                width={28}
                height={4.2}
                rx={1}
                fill="rgba(2, 6, 23, 0.82)"
              />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="2.4"
                fontWeight="600"
              >
                {callout.label.length > 18
                  ? `${callout.label.slice(0, 16)}…`
                  : callout.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
