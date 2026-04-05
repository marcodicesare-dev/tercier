# Codex Agent: Run or Resume the NLP Pipeline on Hotel Reviews

## What This Does

Runs the already-implemented NLP extraction pipeline on hotel reviews in Supabase. The code is built, the schema is deployed, the OpenAI key is configured. Use this to execute or resume the pipeline and handle any issues.

Status note as of 2026-04-04:
- the runner now paginates past Supabase's 1000-row cap automatically
- the runner writes via Supabase REST, not direct Postgres, because this workspace only has `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- the full April 4 backfill completed for all text-bearing rows: `10,714` processed, `38,579` topic rows, `4,006` blank/null-text rows intentionally skipped

---

## Prerequisites (ALL DONE — verify, don't rebuild)

1. **OPENAI_API_KEY** is in `.env.local` — verify it's present
2. **Supabase service-role env vars** are present — verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. **14,720 reviews** in `hotel_reviews` table — verify with: `npx tsx scripts/phase0-enrichment/verify-database.ts`
4. **TypeScript compiles** — verify with: `npx tsc --noEmit`
5. **NLP pipeline script exists** at `scripts/nlp-pipeline/extract.ts` — verify it exists

---

## Step 1: Run the NLP extraction

The pipeline uses OpenAI's Batch API. It creates a batch job, then either waits for completion or lets you poll later.

### Option A: Run with auto-wait (recommended for first run)

```bash
# Process up to the current unprocessed review window, wait for completion
npm run nlp:extract -- --limit 1000 --wait
```

This will:
1. Query 1000 unprocessed reviews from `hotel_reviews` (where `nlp_processed_at IS NULL`)
2. Build JSONL batch input with the NLP extraction prompt
3. Upload to OpenAI Batch API
4. Poll every 30 seconds until complete (typically 5-30 minutes)
5. Download results, parse JSON, write to Supabase:
   - Update `hotel_reviews`: sentiment, sentiment_score, topics, guest_segment, guest_persona, content_seeds, competitor_mentions, nlp_processed_at
   - Insert into `review_topic_index`: one row per aspect per review
   - Generate and write embeddings (halfvec 512-dim) to `hotel_reviews.embedding`

### Option B: Fire and forget, poll later

```bash
# Create batch job
npm run nlp:extract -- --limit 1000

# It will print: "Poll later with: npm run nlp:extract -- --batch-id batch_xxxxx"
# Copy that batch ID, then later:
npm run nlp:extract -- --batch-id batch_xxxxx --wait
```

### Processing ALL 14,720 reviews

Run in batches of 1000:
```bash
# Batch 1
npm run nlp:extract -- --limit 1000 --wait

# Batch 2 (the script auto-skips already-processed reviews)
npm run nlp:extract -- --limit 1000 --wait

# ... repeat until "No unprocessed reviews found."
# Or ask the runner to keep pulling larger windows:
npm run nlp:extract -- --limit 15000 --wait
```

The `--limit 15000` will now page through Supabase in 1000-row ranges and grab up to 15,000 unprocessed reviews for the batch input. OpenAI Batch API handles up to 50,000 requests per batch. Cost: ~$1.45 for GPT-4.1-nano.

---

## Step 2: Verify results

After the pipeline completes:

```bash
# Check review_topic_index is populated
node --input-type=module <<'EOF'
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local', override: false, quiet: true });
config({ path: '.env', override: false, quiet: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { count: processed } = await supabase.from('hotel_reviews').select('*', { count: 'exact', head: true }).not('nlp_processed_at', 'is', null);
const { count: unprocessed } = await supabase.from('hotel_reviews').select('*', { count: 'exact', head: true }).is('nlp_processed_at', null);
const { count: topicRows } = await supabase.from('review_topic_index').select('*', { count: 'exact', head: true });
const { count: withEmbedding } = await supabase.from('hotel_reviews').select('*', { count: 'exact', head: true }).not('embedding', 'is', null);
const { count: withPersona } = await supabase.from('hotel_reviews').select('*', { count: 'exact', head: true }).not('guest_persona', 'is', null);

console.log(`NLP processed: ${processed}`);
console.log(`Unprocessed: ${unprocessed}`);
console.log(`Topic index rows: ${topicRows}`);
console.log(`Reviews with embeddings: ${withEmbedding}`);
console.log(`Reviews with guest persona: ${withPersona}`);
EOF
```

Expected output after full run:
```
NLP processed: all reviews with non-empty text
Unprocessed: rows with null/blank text only
Topic index rows: ~44000 (avg 3 aspects per processed review)
Reviews with embeddings: all processed reviews
Reviews with guest persona: subset of processed reviews (not every review contains persona clues)
```

Note: some provider reviews contain no usable text. Those rows are intentionally skipped by the NLP pipeline and may remain with `nlp_processed_at IS NULL`.

---

## Step 3: Run the aggregator

After NLP extraction, recompute per-hotel aggregate fields from the enriched review data:

```bash
# Re-run enrichment to recompute derived fields from the new NLP data
npm run enrich -- --json '[{"name":"Kempinski Hotel Corvinus Budapest","city":"Budapest","country":"Hungary"},{"name":"The Apurva Kempinski Bali","city":"Nusa Dua","country":"Indonesia"}]'
```

This will recompute:
- `ta_owner_response_rate` from full corpus
- `ta_reviewer_top_locations` from all reviewer locations
- Per-language rating averages
- All derived scores (HQI, TOS, reputation risk)

---

## Troubleshooting

### "Missing OPENAI_API_KEY"
The key is in `.env.local`. Make sure the script loads both env files:
```typescript
import { config } from 'dotenv';
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });
```

### "Missing DATABASE_URL"
This is no longer required in the current runner. The NLP pipeline writes via Supabase REST using the service role key.

### Batch times out (2 hour limit)
OpenAI batches typically complete in 5-30 minutes. If it times out:
1. Check batch status at https://platform.openai.com/batches
2. Use `--batch-id` to resume polling: `npm run nlp:extract -- --batch-id batch_xxxxx --wait`

### Rate limit or quota error
GPT-4.1-nano has generous limits. If you hit quota issues:
- Reduce batch size: `--limit 500`
- Check your OpenAI account spending limit at https://platform.openai.com/settings/organization/limits

### Embedding dimension mismatch
The schema expects `halfvec(512)`. The pipeline uses `text-embedding-3-small` with `dimensions: 512`. If you see a dimension error, check that the HNSW index was created with the correct opclass.

---

## What This Produces

After completion, every review in the database will have:

| Field | What It Contains | Example |
|-------|-----------------|---------|
| `sentiment` | positive/negative/neutral/mixed | "positive" |
| `sentiment_score` | -1.0 to 1.0 | 0.85 |
| `topics` | JSONB array of aspect extractions | `[{"aspect":"staff_service","sentiment":"positive","score":0.92,"mention":"incredibly helpful concierge"}]` |
| `guest_segment` | Inferred segment label | "luxury_couple" |
| `guest_persona` | JSONB with occasion, stay length, spending, repeat | `{"occasion":"anniversary","spending_level":"luxury","is_repeat_guest":true}` |
| `content_seeds` | Marketing-ready quotes | `[{"quote":"sunset from our balcony was unforgettable","emotion":"wonder","segment":"couples"}]` |
| `competitor_mentions` | Hotels mentioned in reviews | `[{"name":"Four Seasons","comparison":"favorable"}]` |
| `embedding` | halfvec(512) for semantic search | 512-dim vector |

Plus `review_topic_index` table populated with ~44,000 aspect-sentiment rows for fast aggregation queries.

**This is the Lumina persona intelligence layer.** The AI product can now answer:
- "What do couples say about the spa?" → query `review_topic_index` WHERE aspect='spa' AND guest_segment LIKE '%couple%'
- "Find reviews similar to this complaint" → `match_reviews()` with embedding similarity
- "What changed in service sentiment this quarter?" → aggregate `review_topic_index` by date range
- "Give me marketing quotes for business travelers" → query `content_seeds` WHERE segment='business'

---

## Cost

| Step | Cost |
|------|------|
| NLP extraction (GPT-4.1-nano batch, 14,720 reviews) | ~$1.45 |
| Embeddings (text-embedding-3-small, 14,720 reviews) | ~$0.08 |
| **Total** | **~$1.53** |

---

## What NOT to Do

- Do NOT rebuild the pipeline — it's already implemented at `scripts/nlp-pipeline/`
- Do NOT modify the schema — all columns and tables are deployed
- Do NOT change the prompt — it's tuned for hotel review extraction
- Do NOT skip embeddings — they enable semantic search via `match_reviews()`
- Do NOT run on a subset thinking "we'll do the rest later" — the Batch API is designed for bulk, just send all 14,720 at once
