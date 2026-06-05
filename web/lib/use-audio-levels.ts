import { useEffect, useState } from "react";

const BAR_COUNT = 12;

export function useAudioLevels(stream: MediaStream | null): number[] {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.08),
  );

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevels(Array.from({ length: BAR_COUNT }, () => 0.08));
      return;
    }

    const context = new AudioContext();
    void context.resume();

    const source = context.createMediaStreamSource(
      new MediaStream(stream.getAudioTracks()),
    );
    const analyser = context.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const slice = Math.floor(data.length / BAR_COUNT);
      const next = Array.from({ length: BAR_COUNT }, (_, index) => {
        const start = index * slice;
        let sum = 0;
        for (let i = start; i < start + slice; i += 1) {
          sum += data[i] ?? 0;
        }
        const avg = sum / slice / 255;
        return Math.max(0.06, Math.min(1, avg * 2.2));
      });
      setLevels(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void context.close();
    };
  }, [stream]);

  return levels;
}
