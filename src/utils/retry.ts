import { BASE_DELAY_MS, MAX_RETRIES } from '../constants/index.js';

// ─── Custom Errors ────────────────────────────────────────────────────────────

export class GitHubApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly endpoint: string,
    message: string
  ) {
    super(`GitHub API ${statusCode} at ${endpoint}: ${message}`);
    this.name = 'GitHubApiError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly resetAt: Date,
    public readonly remaining: number
  ) {
    super(
      `GitHub rate limit exceeded (${remaining} remaining). Resets at ${resetAt.toISOString()}`
    );
    this.name = 'RateLimitError';
  }
}

// ─── Retry with Exponential Backoff ──────────────────────────────────────────

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultShouldRetry(error: Error): boolean {
  // Never retry rate limit errors — the caller must wait until reset
  if (error instanceof RateLimitError) return false;
  // Retry on network errors and 5xx server errors
  if (error instanceof GitHubApiError) {
    return error.statusCode >= 500;
  }
  return true;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    baseDelayMs = BASE_DELAY_MS,
    onRetry,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      onRetry?.(attempt + 1, lastError);

      // Exponential backoff with ±30% jitter
      const delay = baseDelayMs * Math.pow(2, attempt);
      const jitter = (Math.random() - 0.5) * 0.6 * delay;
      await sleep(Math.max(0, delay + jitter));
    }
  }

  throw lastError;
}
