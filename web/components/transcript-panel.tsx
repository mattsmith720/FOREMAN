interface TranscriptPanelProps {
  lines: string[];
}

export function TranscriptPanel({ lines }: TranscriptPanelProps) {
  if (lines.length === 0) {
    return (
      <section className="transcript-panel">
        <h2>Transcript</h2>
        <p className="transcript-empty">
          Speak your pitch — transcript appears here as you talk.
        </p>
      </section>
    );
  }

  return (
    <section className="transcript-panel">
      <h2>Transcript</h2>
      <ul>
        {lines.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
