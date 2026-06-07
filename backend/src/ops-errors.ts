/** In-memory ring buffer of recent 5xx events for /ops error feed. */

export interface OpsErrorEvent {
  at: string;
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  sessionId?: string;
}

const MAX_EVENTS = 50;
const events: OpsErrorEvent[] = [];

export function recordOpsError(event: Omit<OpsErrorEvent, "at">): void {
  events.unshift({ ...event, at: new Date().toISOString() });
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }
}

export function listOpsErrors(limit = 20): OpsErrorEvent[] {
  return events.slice(0, limit);
}
