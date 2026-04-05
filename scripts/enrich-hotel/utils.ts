import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { readCache, writeCache, isCacheFresh } from '../phase0-enrichment/lib/cache.js';
import type { CacheEntry, HotelUpsert } from '../phase0-enrichment/lib/types.js';
import type { SourceStatus } from './types.js';

const cacheMaps = new Map<string, Map<string, CacheEntry<unknown>>>();

export function loadEnvFiles(): void {
  loadEnv({ path: resolve(process.cwd(), '.env.local'), quiet: true });
  loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
}

function getCacheMap<T>(cachePath: string): Map<string, CacheEntry<T>> {
  if (!cacheMaps.has(cachePath)) {
    cacheMaps.set(cachePath, readCache(cachePath));
  }
  return cacheMaps.get(cachePath) as Map<string, CacheEntry<T>>;
}

export async function getCachedOrFetch<T>(
  cachePath: string,
  key: string,
  fetcher: () => Promise<T>,
  maxAgeDays?: number,
): Promise<{ data: T; cached: boolean }> {
  const cache = getCacheMap<T>(cachePath);
  const cached = cache.get(key);
  if (cached && isCacheFresh(cached, maxAgeDays)) {
    return { data: cached.data, cached: true };
  }

  const data = await fetcher();
  writeCache(cachePath, key, data);
  cache.set(key, {
    key,
    timestamp: new Date().toISOString(),
    data,
  });
  return { data, cached: false };
}

export function normalizeDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return value
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase() || null;
  }
}

export function cleanString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = cleanString(value);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }
  return output;
}

export function joinPipe(values: Array<string | null | undefined>): string | null {
  const deduped = uniqueStrings(values);
  return deduped.length ? deduped.join(' | ') : null;
}

export function toIsoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function diffHours(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return null;
  return (endDate - startDate) / 3600000;
}

export function diffDaysFromToday(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return null;
  return Math.floor((Date.now() - date) / 86400000);
}

export function mean(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!filtered.length) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function minValue(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return filtered.length ? Math.min(...filtered) : null;
}

export function maxValue(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return filtered.length ? Math.max(...filtered) : null;
}

export function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>(
    (total, value) => total + (typeof value === 'number' && Number.isFinite(value) ? value : 0),
    0,
  );
}

export function priceLevelToNumeric(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.trim();
  const mapping: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
  return mapping[normalized] ?? null;
}

export function shannonEntropy(probabilities: number[]): number | null {
  const filtered = probabilities.filter(value => value > 0);
  if (!filtered.length) return null;
  return -filtered.reduce((total, value) => total + value * Math.log2(value), 0);
}

export function mergeHotelPartials(partials: Array<HotelUpsert | undefined>): HotelUpsert {
  const merged: HotelUpsert = {};
  for (const partial of partials) {
    if (!partial) continue;
    for (const [key, value] of Object.entries(partial)) {
      if (value !== undefined && value !== null) {
        merged[key] = value;
      } else if (!(key in merged) && value === null) {
        merged[key] = value;
      }
    }
  }
  return merged;
}

export function statusOk(source: string, message: string, cached?: boolean): SourceStatus {
  return { source, state: 'ok', message, cached };
}

export function statusSkipped(source: string, message: string): SourceStatus {
  return { source, state: 'skipped', message };
}

export function statusError(source: string, error: unknown): SourceStatus {
  const message = error instanceof Error ? error.message : String(error);
  return { source, state: 'error', message, error: message };
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function parseCliTargets(args: string[]): { targets: Array<{ name: string; city?: string; country?: string }>; dryRun: boolean } {
  const dryRun = args.includes('--dry-run');
  const jsonIndex = args.indexOf('--json');
  if (jsonIndex !== -1 && args[jsonIndex + 1]) {
    const parsed = safeJsonParse<Array<{ name: string; city?: string; country?: string }>>(args[jsonIndex + 1]);
    if (!parsed || !Array.isArray(parsed)) {
      throw new Error('Invalid JSON passed to --json');
    }
    return { targets: parsed, dryRun };
  }

  const positional = args.filter(arg => !arg.startsWith('--'));
  if (positional.length >= 1) {
    return {
      targets: [{ name: positional[0], city: positional[1], country: positional[2] }],
      dryRun,
    };
  }

  return {
    targets: [
      { name: 'Kempinski Hotel Corvinus Budapest', city: 'Budapest', country: 'Hungary' },
      { name: 'The Apurva Kempinski Bali', city: 'Bali', country: 'Indonesia' },
    ],
    dryRun,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
