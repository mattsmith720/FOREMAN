export interface RetryOptions<T> {
  retries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
  /** Absolute timestamp (ms). Skips further retries once passed. */
  deadline?: number;
  shouldRetryResult?: (result: T, attempt: number) => boolean;
  shouldRetryError?: (error: unknown, attempt: number) => boolean;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const cleanup = () => {
      clearTimeout(timeout);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    const onAbort = () => {
      cleanup();
      reject(signal?.reason ?? new Error("Aborted"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function pastDeadline(deadline: number | undefined): boolean {
  return deadline !== undefined && Date.now() >= deadline;
}

export async function withRetry<T>(
  run: (attempt: number) => Promise<T>,
  options: RetryOptions<T> = {},
): Promise<T> {
  const retries = options.retries ?? 1;
  const baseDelayMs = options.baseDelayMs ?? 150;
  let attempt = 0;

  while (true) {
    const resultOrError = await run(attempt)
      .then((result) => ({ ok: true as const, result }))
      .catch((error: unknown) => ({ ok: false as const, error }));

    if (resultOrError.ok) {
      if (
        attempt < retries &&
        options.shouldRetryResult?.(resultOrError.result, attempt) === true
      ) {
        if (pastDeadline(options.deadline)) {
          return resultOrError.result;
        }
        attempt += 1;
        await sleep(baseDelayMs * 2 ** (attempt - 1), options.signal);
        continue;
      }
      return resultOrError.result;
    }

    if (
      attempt < retries &&
      options.shouldRetryError?.(resultOrError.error, attempt) === true
    ) {
      if (pastDeadline(options.deadline)) {
        throw resultOrError.error;
      }
      attempt += 1;
      await sleep(baseDelayMs * 2 ** (attempt - 1), options.signal);
      continue;
    }

    throw resultOrError.error;
  }
}
