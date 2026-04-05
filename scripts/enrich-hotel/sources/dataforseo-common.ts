import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { PipelineContext } from '../types.js';
import { cleanString } from '../utils.js';

const DFSE_BASE = 'https://api.dataforseo.com/v3';
const DEFAULT_POLL_INTERVAL_MS = 10000;
const DEFAULT_POLL_TIMEOUT_MS = 45 * 60 * 1000;

export function getDataForSeoAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error('Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD');
  }
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

export function getDataForSeoNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return getDataForSeoNumber(obj.value ?? obj.rating ?? obj.score ?? obj.rank);
  }
  return null;
}

export function getDataForSeoString(value: unknown): string | null {
  if (typeof value === 'string') return cleanString(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export async function postDataForSeo<T>(path: string, body: unknown): Promise<T> {
  return await retryWithBackoff(async () => {
    const res = await fetch(`${DFSE_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: getDataForSeoAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`DataForSEO ${res.status}: ${text.slice(0, 400)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return (await res.json()) as T;
  });
}

export async function getDataForSeoTask<T>(path: string): Promise<T> {
  return await retryWithBackoff(async () => {
    const res = await fetch(`${DFSE_BASE}${path}`, {
      headers: {
        Authorization: getDataForSeoAuthHeader(),
      },
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`DataForSEO ${res.status}: ${text.slice(0, 400)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return (await res.json()) as T;
  });
}

export async function createDataForSeoTaskAndPoll(
  postPath: string,
  getBasePath: string,
  body: unknown,
  options?: { pollIntervalMs?: number; timeoutMs?: number },
): Promise<any[]> {
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;

  const created = await postDataForSeo<any>(postPath, body);
  const createdTask = created?.tasks?.[0];
  const createdStatusCode = typeof createdTask?.status_code === 'number' ? createdTask.status_code : null;
  if (createdStatusCode != null && createdStatusCode >= 40000) {
    throw new Error(`DataForSEO task rejected: ${createdStatusCode} ${createdTask?.status_message ?? 'unknown error'}`);
  }

  const taskId = getDataForSeoString(createdTask?.id);
  if (!taskId) {
    throw new Error('DataForSEO did not return a task id');
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await getDataForSeoTask<any>(`${getBasePath}/${taskId}`);
    const task = result?.tasks?.[0];
    const statusCode = task?.status_code;
    const items = task?.result?.[0]?.items;

    if (statusCode === 20000) {
      return Array.isArray(items) ? items : [];
    }

    if (statusCode == null || [20100, 40601, 40602].includes(statusCode)) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      continue;
    }

    throw new Error(`DataForSEO task failed: ${statusCode} ${task?.status_message ?? 'unknown error'}`);
  }

  throw new Error('DataForSEO task timed out');
}

export function buildDataForSeoLocationParams(context: PipelineContext): Record<string, string> {
  if (typeof context.latitude === 'number' && typeof context.longitude === 'number') {
    return {
      location_coordinate: `${context.latitude},${context.longitude},500`,
    };
  }

  const locationName = [context.input.city, context.input.country].filter(Boolean).join(',');
  return locationName ? { location_name: locationName } : {};
}
