/**
 * Verify that the Supabase database schema is correctly set up.
 *
 * Checks that all expected tables exist and are accessible via the Supabase REST API.
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/verify-database.ts
 */
import 'dotenv/config';
import { supabase } from './lib/supabase.js';

const EXPECTED_TABLES = [
  'hotels',
  'hotel_amenities',
  'hotel_reviews',
  'hotel_qna',
  'hotel_competitors',
  'hotel_lang_ratings',
  'enrichment_snapshots',
  'hotel_metric_snapshots',
  'hotel_price_snapshots',
  'review_topic_index',
  'pipeline_runs',
];

async function main(): Promise<void> {
  console.log('Verifying Supabase database schema...\n');

  let allGood = true;
  let hotelsColumnCount: number | null = null;

  for (const table of EXPECTED_TABLES) {
    try {
      const selectClause = table === 'hotels' ? '*' : 'id';
      const { data, error, count } = await supabase
        .from(table)
        .select(selectClause, { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`  [FAIL] ${table}: ${error.message}`);
        allGood = false;
      } else {
        console.log(`  [OK]   ${table} (${count ?? data?.length ?? 0} rows)`);
        if (table === 'hotels' && data && data.length > 0) {
          hotelsColumnCount = Object.keys(data[0]).length;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  [FAIL] ${table}: ${msg}`);
      allGood = false;
    }
  }

  console.log();
  if (allGood) {
    console.log('All tables verified. Database is ready.');
    if (hotelsColumnCount !== null) {
      console.log(`Hotels table columns (via sample row): ${hotelsColumnCount}`);
    }
    console.log('\nNext: npm run phase0:match-ta -- --limit 10 --dry-run');
    console.log('Or:   npm run phase0 -- --limit 10');
  } else {
    console.log('Some tables are missing. Run the schema SQL first.');
    console.log('See: scripts/phase0-enrichment/supabase-schema.sql');
  }
}

main().catch(err => {
  console.error('Verify failed:', err);
  process.exit(1);
});
