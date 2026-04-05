import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { CacheEntry } from './types.js';

const CACHE_TTL_DAYS = 7;

export function ensureCacheDir(cachePath: string): void {
  const dir = dirname(cachePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function readCache<T>(cachePath: string): Map<string, CacheEntry<T>> {
  if (!existsSync(cachePath)) return new Map();
  const content = readFileSync(cachePath, 'utf-8').trim();
  if (!content) return new Map();

  const map = new Map<string, CacheEntry<T>>();
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as CacheEntry<T>;
      map.set(entry.key, entry);
    } catch {
      // Skip malformed lines — don't crash the pipeline
    }
  }
  return map;
}

export function writeCache<T>(cachePath: string, key: string, data: T): void {
  ensureCacheDir(cachePath);
  const entry: CacheEntry<T> = {
    key,
    timestamp: new Date().toISOString(),
    data,
  };
  appendFileSync(cachePath, JSON.stringify(entry) + '\n');
}

export function isCacheFresh<T>(entry: CacheEntry<T>, maxAgeDays: number = CACHE_TTL_DAYS): boolean {
  const ageMs = Date.now() - new Date(entry.timestamp).getTime();
  return ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
}
