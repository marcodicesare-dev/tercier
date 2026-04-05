import { resolve } from 'node:path';
import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { DiscoveryResult, PipelineContext, SourceResult } from '../types.js';
import { cleanString, getCachedOrFetch, statusError, statusOk, statusSkipped } from '../utils.js';

const CACHE_OVERPASS = resolve(process.cwd(), 'scripts/enrich-hotel/cache/osm-overpass.jsonl');
const CACHE_NOMINATIM = resolve(process.cwd(), 'scripts/enrich-hotel/cache/osm-nominatim.jsonl');

interface OverpassResponse {
  elements?: Array<{
    id: number;
    type: string;
    lat?: number;
    lon?: number;
    center?: { lat?: number; lon?: number };
    tags?: Record<string, string>;
  }>;
}

interface NominatimResponseItem {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  extratags?: Record<string, string>;
}

async function overpass(query: string): Promise<OverpassResponse> {
  return await retryWithBackoff(async () => {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }).toString(),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`Overpass ${res.status}: ${text.slice(0, 220)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return (await res.json()) as OverpassResponse;
  });
}

async function nominatim(query: string): Promise<NominatimResponseItem[]> {
  return await retryWithBackoff(async () => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('extratags', '1');
    url.searchParams.set('limit', '1');
    const res = await fetch(url, {
      headers: { 'User-Agent': 'tercier-enrichment/1.0' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`Nominatim ${res.status}: ${text.slice(0, 220)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return (await res.json()) as NominatimResponseItem[];
  });
}

export async function discoverOsm(context: PipelineContext): Promise<DiscoveryResult> {
  try {
    const query = [context.input.name, context.input.city, context.input.country].filter(Boolean).join(', ');
    const result = await getCachedOrFetch<NominatimResponseItem[]>(
      CACHE_NOMINATIM,
      query,
      async () => await nominatim(query),
    );

    const item = result.data[0];
    if (!item?.osm_id || !item.osm_type) {
      return { ok: false, message: 'No OSM/Nominatim result found' };
    }

    const osmPrefix = item.osm_type === 'way' ? 'way' : item.osm_type === 'relation' ? 'relation' : 'node';
    return {
      ok: true,
      osmId: `${osmPrefix}/${item.osm_id}`,
      latitude: item.lat ? Number.parseFloat(item.lat) : null,
      longitude: item.lon ? Number.parseFloat(item.lon) : null,
      message: `OSM match ${osmPrefix}/${item.osm_id}`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function runOsm(context: PipelineContext): Promise<SourceResult> {
  const query = [context.input.name, context.input.city, context.input.country].filter(Boolean).join(', ');
  const latitude = context.latitude;
  const longitude = context.longitude;

  try {
    let element: NonNullable<OverpassResponse['elements']>[number] | null = null;

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      const overpassQuery = `[out:json][timeout:25];nwr["tourism"="hotel"]["name"~"${context.input.name.replace(/"/g, '\\"')}",i](around:5000,${latitude},${longitude});out center tags;`;
      try {
        const overpassResult = await getCachedOrFetch<OverpassResponse>(
          CACHE_OVERPASS,
          `${context.input.name}:${latitude}:${longitude}`,
          async () => await overpass(overpassQuery),
        );
        element = overpassResult.data.elements?.[0] ?? null;
      } catch {
        element = null;
      }
    }

    if (!element) {
      const nominatimResult = await getCachedOrFetch<NominatimResponseItem[]>(
        CACHE_NOMINATIM,
        query,
        async () => await nominatim(query),
      );
      const item = nominatimResult.data[0];
      if (item?.osm_id && item.osm_type) {
        return {
          hotel: {
            osm_id: `${item.osm_type === 'way' ? 'way' : item.osm_type === 'relation' ? 'relation' : 'node'}/${item.osm_id}`,
            osm_rooms: item.extratags?.rooms ? Number.parseInt(item.extratags.rooms, 10) : null,
            osm_stars: item.extratags?.stars ? Number.parseInt(item.extratags.stars, 10) : null,
          },
          statuses: [statusOk('osm', `nominatim=${item.osm_type}/${item.osm_id}`, nominatimResult.cached)],
        };
      }

      return { statuses: [statusSkipped('osm', 'No OSM match found')] };
    }

    const lat = element.center?.lat ?? element.lat ?? null;
    const lon = element.center?.lon ?? element.lon ?? null;
    return {
      hotel: {
        osm_id: `${element.type}/${element.id}`,
        osm_rooms: element.tags?.rooms ? Number.parseInt(element.tags.rooms, 10) : null,
        osm_stars: element.tags?.stars ? Number.parseInt(element.tags.stars, 10) : null,
        latitude: lat ?? context.latitude ?? null,
        longitude: lon ?? context.longitude ?? null,
      },
      statuses: [statusOk('osm', `overpass=${element.type}/${element.id}`)],
    };
  } catch (error) {
    return {
      statuses: [statusError('osm', error)],
    };
  }
}
