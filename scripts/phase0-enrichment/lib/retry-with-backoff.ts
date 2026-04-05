export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 15000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const candidate = error as { code?: string; name?: string; message?: string; status?: number };
  if (candidate?.status != null) {
    if (candidate.status === 408 || candidate.status === 429) return true;
    if (candidate.status >= 500) return true;
    return false;
  }

  if (candidate?.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN'].includes(candidate.code)) {
    return true;
  }

  if (candidate?.name === 'AbortError') {
    return true;
  }

  if (typeof candidate?.message === 'string' && /timeout|timed out|temporarily unavailable/i.test(candidate.message)) {
    return true;
  }

  return false;
}

function calculateDelay(attempt: number, opts: Required<RetryOptions>): number {
  const base = Math.min(
    opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt),
    opts.maxDelayMs,
  );
  const jitter = base * (0.15 + Math.random() * 0.2);
  return Math.round(base + jitter);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= opts.maxRetries || !isRetryable(error)) {
        break;
      }
      await sleep(calculateDelay(attempt, opts));
    }
  }

  throw lastError;
}
