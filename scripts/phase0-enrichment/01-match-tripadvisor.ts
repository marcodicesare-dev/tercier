/**
 * Step 1: Match hotelleriesuisse hotels to TripAdvisor location IDs.
 *
 * Reads enriched-master.csv, searches TA for each hotel by name + city,
 * scores matches, and upserts results into Supabase.
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/01-match-tripadvisor.ts [--limit N] [--dry-run]
 */
import 'dotenv/config';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse';
import { supabase, logPipelineStart, logPipelineEnd } from './lib/supabase.js';
import { searchHotel, getTACallCount } from './lib/tripadvisor-client.js';
import { readCache, writeCache, isCacheFresh } from './lib/cache.js';
import { nameSimilarity } from './lib/matching.js';
import { ProgressLogger } from './lib/logger.js';
import type { HotelleriesuisseRow, TASearchResponse, TASearchResult } from './lib/types.js';

// ── Config ──
const INPUT_CSV = resolve(process.cwd(), 'hotelleriesuisse-members-hotels-switzerland.enriched-master.csv');
const CACHE_PATH = resolve(process.cwd(), 'scripts/phase0-enrichment/cache/ta-search-results.jsonl');
const MATCH_THRESHOLD = 0.45;  // Minimum similarity to accept a match

// ── CLI args ──
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;
const DRY_RUN = args.includes('--dry-run');

// ── CSV Reader ──
async function readCsv(): Promise<HotelleriesuisseRow[]> {
  const rows: HotelleriesuisseRow[] = [];
  return new Promise((resolve, reject) => {
    createReadStream(INPUT_CSV)
      .pipe(parse({
        columns: true,
        bom: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }))
      .on('data', (row: HotelleriesuisseRow) => {
        rows.push(row);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// ── Match Scoring ──
interface MatchCandidate {
  result: TASearchResult;
  score: number;
  confidence: 'gold' | 'silver' | 'bronze';
}

function scoreMatch(csvName: string, csvCity: string, result: TASearchResult): MatchCandidate | null {
  const similarity = nameSimilarity(csvName, result.name);
  const resultCity = result.address_obj?.city?.toLowerCase() ?? '';
  const csvCityLower = csvCity.toLowerCase();
  const cityMatch = resultCity === csvCityLower || resultCity.includes(csvCityLower) || csvCityLower.includes(resultCity);

  // Require city match or high name similarity
  if (!cityMatch && similarity < 0.7) return null;

  let score = similarity;
  if (cityMatch) score += 0.2;
  if (result.address_obj?.country?.toLowerCase() === 'switzerland') score += 0.1;

  let confidence: 'gold' | 'silver' | 'bronze';
  if (similarity >= 0.85 && cityMatch) confidence = 'gold';
  else if (similarity >= 0.6 && cityMatch) confidence = 'silver';
  else confidence = 'bronze';

  return { result, score, confidence };
}

function findBestMatch(csvName: string, csvCity: string, results: TASearchResult[]): MatchCandidate | null {
  const candidates = results
    .map(r => scoreMatch(csvName, csvCity, r))
    .filter((c): c is MatchCandidate => c !== null)
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best;
}

// ── Main ──
export default async function matchTripadvisor(): Promise<void> {
  console.log('\n--- Step 1: Match Hotels to TripAdvisor ---\n');

  // Read CSV
  const allRows = await readCsv();
  const rows = allRows.slice(0, LIMIT);
  console.log(`Loaded ${allRows.length} hotels from CSV (processing ${rows.length})`);

  // Load cache
  const cache = readCache<TASearchResponse>(CACHE_PATH);
  console.log(`Cache: ${cache.size} entries loaded`);

  // Stats
  let matched = 0;
  let unmatched = 0;
  let cached = 0;
  let errors = 0;

  const logger = new ProgressLogger('TA Match', rows.length, 15);
  const runId = DRY_RUN ? 'dry-run' : await logPipelineStart('match_ta', rows.length);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const slug = row.slug;
    const name = row.name;
    const city = row.location;

    if (!slug || !name || !city) {
      errors++;
      continue;
    }

    try {
      // Check cache
      let searchResponse: TASearchResponse;
      const cacheKey = `${slug}`;
      const cacheEntry = cache.get(cacheKey);

      if (cacheEntry && isCacheFresh(cacheEntry)) {
        searchResponse = cacheEntry.data;
        cached++;
      } else {
        // API call: search by "name city"
        const query = `${name} ${city}`;
        searchResponse = await searchHotel(query);
        writeCache(CACHE_PATH, cacheKey, searchResponse);
      }

      // Score matches
      const best = findBestMatch(name, city, searchResponse.data);

      // Parse lat/lng from CSV for DB storage
      // The enriched master doesn't have lat/lng directly, but may have them from sr_ enrichment
      // We'll get precise lat/lng from TA Details in step 2
      const roomsCount = row.roomsCount ? parseInt(row.roomsCount, 10) : null;
      const priceChf = row.priceNightlyChf ? parseFloat(row.priceNightlyChf) : null;
      const revenueProxy = row.sr_annual_room_revenue_proxy_chf ? parseFloat(row.sr_annual_room_revenue_proxy_chf) : null;
      const starRating = row.starRating ? parseInt(row.starRating, 10) : null;

      // Prepare upsert data
      const hotelData: Record<string, unknown> = {
        hs_slug: slug,
        name,
        city,
        country: 'Switzerland',

        // HotellerieSuisse fields
        hs_star_rating: starRating,
        hs_is_superior: row.isSuperior === 'true',
        hs_hotel_type: row.hotelType || null,
        hs_rooms_count: roomsCount,
        hs_phone: row.phone || null,
        hs_email: row.email || null,
        hs_website_url: row.websiteUrl || null,
        hs_price_nightly_chf: priceChf,
        hs_revenue_proxy_chf: revenueProxy,
        hs_market_segment: row.sr_market_segment || null,
        hs_booking_flow_type: row.sr_booking_flow_type || null,
        hs_positioning_pillars: row.sr_positioning_pillars || null,
        hs_audience_signals: row.sr_audience_signals || null,
        website_url: row.websiteUrl || null,
        phone: row.phone || null,

        // Contact enrichment
        cx_gm_name: row.gmName || null,
        cx_gm_title: row.gmTitle || null,
      };

      if (best) {
        hotelData.ta_location_id = best.result.location_id;
        hotelData.enrichment_status = 'ta_matched';
        hotelData.ta_matched_at = new Date().toISOString();
        matched++;
      } else {
        hotelData.enrichment_status = 'ta_match_failed';
        unmatched++;
      }

      if (!DRY_RUN) {
        const { error: upsertError } = await supabase
          .from('hotels')
          .upsert(hotelData, { onConflict: 'hs_slug' });

        if (upsertError) {
          console.error(`[ERROR] Upsert failed for ${slug}: ${upsertError.message}`);
          errors++;
        }
      } else {
        const matchInfo = best
          ? `MATCHED (${best.confidence}) -> ${best.result.name} [${best.result.location_id}] (score: ${best.score.toFixed(3)})`
          : 'NO MATCH';
        console.log(`  ${slug}: ${matchInfo}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] ${slug}: ${msg}`);
      errors++;
    }

    logger.log(i + 1, { matched, unmatched, cached, errors, apiCalls: getTACallCount() });
  }

  logger.done({ matched, unmatched, cached, errors, apiCalls: getTACallCount() });

  if (!DRY_RUN) {
    await logPipelineEnd(runId, errors > rows.length / 2 ? 'failed' : 'completed', {
      processed: rows.length,
      matched,
      failed: errors,
    });
  }

  console.log(`\nMatch rate: ${((matched / rows.length) * 100).toFixed(1)}%`);
  console.log(`API calls made: ${getTACallCount()}`);
}

// Allow running standalone
if (process.argv[1]?.includes('01-match-tripadvisor')) {
  matchTripadvisor().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
