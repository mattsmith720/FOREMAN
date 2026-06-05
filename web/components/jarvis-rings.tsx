interface JarvisRingsProps {
  isAnalysing: boolean;
  isActive: boolean;
}

export function JarvisRings({ isAnalysing, isActive }: JarvisRingsProps) {
  return (
    <div
      className={`jarvis-rings ${isAnalysing ? "analysing" : ""} ${isActive ? "active" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" className="jarvis-rings-svg">
        <circle cx="100" cy="100" r="88" className="ring ring-outer" />
        <circle cx="100" cy="100" r="72" className="ring ring-mid" />
        <circle cx="100" cy="100" r="56" className="ring ring-inner" />
        <circle cx="100" cy="100" r="40" className="ring ring-core" />
        <line x1="100" y1="12" x2="100" y2="36" className="ring-tick" />
        <line x1="100" y1="164" x2="100" y2="188" className="ring-tick" />
        <line x1="12" y1="100" x2="36" y2="100" className="ring-tick" />
        <line x1="164" y1="100" x2="188" y2="100" className="ring-tick" />
        <circle cx="100" cy="100" r="6" className="ring-dot" />
      </svg>
    </div>
  );
}
