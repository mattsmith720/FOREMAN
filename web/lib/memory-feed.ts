export type MemoryEventKind =
  | "frame"
  | "transcript"
  | "coaching"
  | "learning";

export interface MemoryEvent {
  id: string;
  kind: MemoryEventKind;
  message: string;
  ts: number;
}

let counter = 0;

export function createMemoryEvent(
  kind: MemoryEventKind,
  message: string,
): MemoryEvent {
  counter += 1;
  return {
    id: `${kind}-${counter}-${Date.now()}`,
    kind,
    message,
    ts: Date.now(),
  };
}
