/**
 * Step 3: Match hotels to Google Place IDs via Autocomplete.
 *
 * Uses Google Places Autocomplete ($2.83/1000 calls) with
 * locationBias near the hotel's known lat/lng coordinates.
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/03-match-google-places.ts [--limit N]
 */
import 'dotenv/config';
import { resolve } from 'path';
import { fetchAllRows, supabase, logPipelineStart, logPipelineEnd } from './lib/supabase.js';
import { autocompleteHotel, getGPCallCount } from './lib/google-places-client.js';
import { readCache, writeCache, isCacheFresh } from './lib/cache.js';
import { nameSimilarity } from './lib/matching.js';
import { ProgressLogger } from './lib/logger.js';
import type { GPAutocompleteResponse } from './lib/types.js';

// ── Config ──
const CACHE_PATH = resolve(process.cwd(), 'scripts/phase0-enrichment/cache/gp-autocomplete.jsonl');
const MATCH_THRESHOLD = 0.4;

// ── CLI args ──
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

// ── Main ──
export default async function matchGooglePlaces(): Promise<void> {
  console.log('\n--- Step 3: Match Hotels to Google Places ---\n');

  // Fetch hotels that need Google matching
  // Include both TA-enriched and TA-match-failed (Google might find them)
  const hotels = await fetchAllRows((from, to) =>
    supabase
      .from('hotels')
      .select('id, hs_slug, name, city, latitude, longitude, enrichment_status')
      .in('enrichment_status', ['ta_enriched', 'ta_match_failed'])
      .is('gp_place_id', null)
      .order('hs_slug')
      .range(from, to),
  LIMIT);

  if (!hotels || hotels.length === 0) {
    console.log('No hotels need Google matching. All done or run prior steps first.');
    return;
  }

  console.log(`Found ${hotels.length} hotels to match with Google Places`);

  // Load cache
  const cache = readCache<GPAutocompleteResponse>(CACHE_PATH);
  console.log(`Cache: ${cache.size} entries loaded`);

  const logger = new ProgressLogger('GP Match', hotels.length, 15);
  const runId = await logPipelineStart('match_gp', hotels.length);
  let matched = 0;
  let unmatched = 0;
  let cached = 0;
  let errors = 0;
  let processed = 0;

  for (const hotel of hotels) {
    const { id, hs_slug, name, city, latitude, longitude } = hotel;

    try {
      // Need lat/lng for locationBias. If we don't have it, skip or use city center.
      // Switzerland approximate center for fallback
      const lat = latitude ?? 46.8;
      const lng = longitude ?? 8.2;

      // Check cache
      const cacheKey = hs_slug;
      const cacheEntry = cache.get(cacheKey);
      let response: GPAutocompleteResponse;

      if (cacheEntry && isCacheFresh(cacheEntry)) {
        response = cacheEntry.data;
        cached++;
      } else {
        // Try with just the hotel name first (locationBias handles geography)
        response = await autocompleteHotel(name, lat, lng, 'CH');
        writeCache(CACHE_PATH, cacheKey, response);
      }

      // Find best match from suggestions
      let bestPlaceId: string | null = null;
      let bestScore = 0;
      let bestName = '';

      if (response.suggestions) {
        for (const suggestion of response.suggestions) {
          const pred = suggestion.placePrediction;
          if (!pred) continue;

          const sugName = pred.structuredFormat.mainText.text;
          const similarity = nameSimilarity(name, sugName);

          if (similarity > bestScore) {
            bestScore = similarity;
            bestPlaceId = pred.placeId;
            bestName = sugName;
          }
        }
      }

      // If no match or low score, try with city appended
      if ((!bestPlaceId || bestScore < MATCH_THRESHOLD) && city) {
        const retryKey = `${hs_slug}_retry`;
        const retryCacheEntry = cache.get(retryKey);
        let retryResponse: GPAutocompleteResponse;

        if (retryCacheEntry && isCacheFresh(retryCacheEntry)) {
          retryResponse = retryCacheEntry.data;
        } else {
          retryResponse = await autocompleteHotel(`${name} ${city}`, lat, lng, 'CH');
          writeCache(CACHE_PATH, retryKey, retryResponse);
        }

        if (retryResponse.suggestions) {
          for (const suggestion of retryResponse.suggestions) {
            const pred = suggestion.placePrediction;
            if (!pred) continue;

            const sugName = pred.structuredFormat.mainText.text;
            const similarity = nameSimilarity(name, sugName);

            if (similarity > bestScore) {
              bestScore = similarity;
              bestPlaceId = pred.placeId;
              bestName = sugName;
            }
          }
        }
      }

      // Update DB
      if (bestPlaceId && bestScore >= MATCH_THRESHOLD) {
        const { error: updateError } = await supabase
          .from('hotels')
          .update({
            gp_place_id: bestPlaceId,
            gp_matched_at: new Date().toISOString(),
            // Don't update enrichment_status here — step 4 will set gp_enriched
          })
          .eq('id', id);

        if (updateError) {
          console.error(`[ERROR] Update failed for ${hs_slug}: ${updateError.message}`);
          errors++;
        } else {
          matched++;
        }
      } else {
        unmatched++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] ${hs_slug}: ${msg}`);
      errors++;
    }

    processed++;
    logger.log(processed, { matched, unmatched, cached, errors, apiCalls: getGPCallCount() });
  }

  logger.done({ matched, unmatched, cached, errors, apiCalls: getGPCallCount() });

  await logPipelineEnd(runId, errors > hotels.length / 2 ? 'failed' : 'completed', {
    processed,
    matched,
    failed: errors,
  });

  console.log(`\nMatch rate: ${((matched / hotels.length) * 100).toFixed(1)}%`);
  console.log(`API calls made: ${getGPCallCount()}`);
  console.log(`Estimated cost: $${((getGPCallCount() / 1000) * 2.83).toFixed(2)}`);
}

// Allow running standalone
if (process.argv[1]?.includes('03-match-google-places')) {
  matchGooglePlaces().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
