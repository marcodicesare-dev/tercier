# Codex Agent: NLP Intelligence Pipeline + New Data Sources

> Status note (2026-04-04): the schema migration plus the DataForSEO Q&A / GMB enrichment layer are now implemented in the repo and applied to Supabase. The remaining unexecuted part of this prompt is the OpenAI-backed NLP/embedding population pass, which is blocked locally only by a missing `OPENAI_API_KEY`.

## What This Does

Three things in one build:

1. **NLP extraction pipeline** — process 14,720 hotel reviews through GPT-4.1-nano to extract aspect sentiment, guest personas, competitor mentions, and content seeds. Cost: ~$1.53 total.

2. **New DataForSEO sources** — add Google Q&A, Google My Business Info, and Google Hotel Info endpoints to the enrichment pipeline. These fill unique gaps (guest questions, foot traffic, `is_claimed` signal, structured pricing).

3. **Schema additions** — add ~18 new fields to support Booking.com cross-platform data, AI visibility, government star ratings, and expanded digital maturity signals.

---

## Part 1: NLP Extraction Pipeline

### Architecture

```
scripts/nlp-pipeline/
├── extract.ts                  # Main orchestrator — processes unprocessed reviews
├── lib/
│   ├── openai-client.ts        # GPT-4.1-nano batch API client
│   ├── embedding-client.ts     # text-embedding-3-small client
│   └── aggregator.ts           # Compute per-hotel aggregates from extracted data
└── cache/
    └── nlp-batches/            # Batch job results cache
```

### The Single-Pass Prompt

One LLM call per review extracts everything:

```typescript
const SYSTEM_PROMPT = `You are a hotel review intelligence extractor. Analyze the review and return structured JSON.

Analyze in the source language. Return aspect names in English. Return mention_text quotes in the original language.

Taxonomy of aspects: room_cleanliness, bed_quality, bathroom, noise, view, design_decor, staff_service, checkin_checkout, breakfast, restaurant, bar, food_quality, wifi, spa, pool, parking, security, value_for_money, location_convenience

Return EXACTLY this JSON structure:
{
  "overall_sentiment": "positive|negative|neutral|mixed",
  "overall_sentiment_score": <float -1.0 to 1.0>,
  "aspects": [
    {
      "aspect": "<from taxonomy>",
      "sentiment": "positive|negative|neutral|mixed",
      "score": <float -1.0 to 1.0>,
      "mention": "<exact quote from review, max 100 chars>"
    }
  ],
  "guest_persona": {
    "occasion": "anniversary|honeymoon|birthday|business_conference|family_vacation|holiday|getaway|null",
    "length_of_stay": "overnight|weekend|short_stay|week|extended|null",
    "spending_level": "budget|moderate|upscale|luxury|ultra_luxury|null",
    "is_repeat_guest": <boolean|null>,
    "repeat_visit_count": <int|null>,
    "group_detail": "couple|couple_with_toddler|couple_with_kids|elderly_parents|large_group|solo_female|solo_male|friends_group|null"
  },
  "competitor_mentions": [
    {
      "name": "<hotel name>",
      "comparison": "favorable|unfavorable|neutral|migration",
      "quote": "<exact text>"
    }
  ],
  "content_seeds": [
    {
      "quote": "<emotionally resonant, specific, visual phrase from review>",
      "emotion": "wonder|delight|gratitude|romance|comfort|excitement|disappointment|frustration",
      "segment": "couples|families|business|solo|friends",
      "use": "testimonial|visual_hero|social_proof"
    }
  ]
}`;

function buildUserPrompt(review: { text: string; rating: number; lang: string; trip_type: string | null }): string {
  return `Review (${review.lang}, rating: ${review.rating}/5${review.trip_type ? `, trip type: ${review.trip_type}` : ''}):

${review.text}`;
}
```

### Model: GPT-4.1-nano via Batch API

```typescript
// Install: npm install openai
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

**You need to add `OPENAI_API_KEY` to `.env`.** Sign up at https://platform.openai.com if you don't have one.

### Batch Processing Flow

```typescript
// 1. Query unprocessed reviews
const { data: reviews } = await supabase
  .from('hotel_reviews')
  .select('id, hotel_id, text, rating, lang, trip_type')
  .is('nlp_processed_at', null)
  .not('text', 'is', null)
  .order('published_date', { ascending: false })
  .limit(1000);

// 2. Build batch input (JSONL format for OpenAI Batch API)
const batchLines = reviews.map(review => JSON.stringify({
  custom_id: review.id,
  method: 'POST',
  url: '/v1/chat/completions',
  body: {
    model: 'gpt-4.1-nano',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(review) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 800,
  },
}));

// 3. Upload batch file
const file = await openai.files.create({
  file: new Blob([batchLines.join('\n')], { type: 'application/jsonl' }),
  purpose: 'batch',
});

// 4. Create batch job
const batch = await openai.batches.create({
  input_file_id: file.id,
  endpoint: '/v1/chat/completions',
  completion_window: '24h',
});

// 5. Poll for completion (batches complete within 24h, usually much faster)
// 6. Download results, parse, write to Supabase
```

### Writing Results to Supabase

For each processed review, update `hotel_reviews` and insert into `review_topic_index`:

```typescript
// Update the review row
await supabase.from('hotel_reviews').update({
  sentiment: result.overall_sentiment,
  sentiment_score: result.overall_sentiment_score,
  topics: result.aspects,
  guest_segment: inferGuestSegment(result.guest_persona, review.trip_type),
  guest_persona: result.guest_persona,
  content_seeds: result.content_seeds,
  competitor_mentions: result.competitor_mentions,
  nlp_processed_at: new Date().toISOString(),
}).eq('id', review.id);

// Insert aspect-level rows into review_topic_index
for (const aspect of result.aspects) {
  await supabase.from('review_topic_index').upsert({
    hotel_id: review.hotel_id,
    review_id: review.id,
    aspect: aspect.aspect,
    sentiment: aspect.sentiment,
    sentiment_score: aspect.score,
    mention_text: aspect.mention,
    lang: review.lang,
    published_date: review.published_date,
  }, { onConflict: 'review_id,aspect' });
}
```

### Embedding Generation

After NLP extraction, embed all reviews:

```typescript
// Batch embed (OpenAI supports up to 2048 embeddings per call)
const EMBED_BATCH = 500;
for (let i = 0; i < reviews.length; i += EMBED_BATCH) {
  const batch = reviews.slice(i, i + EMBED_BATCH);
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 512,
    input: batch.map(r => r.text),
  });
  // Write embeddings to hotel_reviews.embedding
  for (let j = 0; j < response.data.length; j++) {
    await supabase.from('hotel_reviews').update({
      embedding: response.data[j].embedding,
    }).eq('id', batch[j].id);
  }
}
```

### Schema Additions

```sql
-- New columns on hotel_reviews (some already exist, use IF NOT EXISTS)
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS guest_persona JSONB;
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS content_seeds JSONB;
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS competitor_mentions JSONB;
```

### Cost

| Step | Cost |
|------|------|
| NLP extraction (GPT-4.1-nano batch, 14,720 reviews) | ~$1.45 |
| Embeddings (text-embedding-3-small, 14,720 reviews) | ~$0.08 |
| **Total** | **~$1.53** |

---

## Part 2: New DataForSEO Sources

### 2a. Google Q&A (`sources/dataforseo-qna.ts`)

**Endpoint:** `POST https://api.dataforseo.com/v3/business_data/google/questions_and_answers/task_post`

**Request:**
```json
[{
  "keyword": "Kempinski Hotel Corvinus Budapest",
  "location_name": "Budapest,Hungary",
  "language_name": "English",
  "depth": 100,
  "priority": 2
}]
```

**What it returns per question:**
- `question_text` — the guest's actual question
- `answer_items[]` — array of answers with text, author, timestamp
- `items_without_answers` — unanswered question count

**New table:**
```sql
CREATE TABLE IF NOT EXISTS hotel_qna (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT,
  answered_by TEXT,
  question_date TIMESTAMPTZ,
  answer_date   TIMESTAMPTZ,
  source      TEXT DEFAULT 'google',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, question)
);
CREATE INDEX IF NOT EXISTS idx_qna_hotel ON hotel_qna(hotel_id);
```

**New computed fields on hotels:**
```sql
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS qna_count INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS qna_unanswered_count INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS qna_response_rate REAL;
```

**Cost:** $0.00075/20 questions per hotel.

### 2b. Google My Business Info (`sources/dataforseo-gmb.ts`)

**Endpoint:** `POST https://api.dataforseo.com/v3/business_data/google/my_business_info/task_post`

**Request:**
```json
[{
  "keyword": "Kempinski Hotel Corvinus Budapest",
  "location_name": "Budapest,Hungary",
  "language_name": "English",
  "priority": 2
}]
```

**Unique fields this provides:**
- `popular_times` — hourly foot traffic patterns by day of week
- `is_claimed` — whether the hotel has claimed their GMB listing (sales signal!)
- `place_topics` — keywords extracted from customer reviews (free NLP)
- `hotel_rating` — official star classification from Google
- `people_also_search` — related businesses (competitor discovery)
- `book_online_url` — direct booking link
- `rating_distribution` — Google 1-5 star breakdown

**New fields on hotels:**
```sql
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_is_claimed BOOLEAN;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_popular_times JSONB;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_place_topics JSONB;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_hotel_star_rating INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_book_online_url TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_people_also_search JSONB;
```

**Cost:** $0.0015/hotel. For 2 Kempinskis: $0.003.

### 2c. Google Hotel Info (replaces SerpApi for pricing)

**Endpoint:** `POST https://api.dataforseo.com/v3/business_data/google/hotel_info/task_post`

**Requires `hotel_identifier`** from Google Hotel Searches first:
```json
// Step 1: Find hotel_identifier
POST /v3/business_data/google/hotel_searches/task_post
[{ "keyword": "hotels in Budapest", "location_name": "Budapest,Hungary", "language_name": "English", "depth": 140, "check_in": "2026-04-10", "check_out": "2026-04-11", "priority": 2 }]

// Step 2: Use hotel_identifier for detailed info
POST /v3/business_data/google/hotel_info/task_post
[{ "hotel_identifier": "<from step 1>", "check_in": "2026-04-10", "check_out": "2026-04-11", "load_prices_by_dates": true, "priority": 2 }]
```

**Unique data:** Structured amenities with availability flags, location quality scores (things_to_do, restaurants, transit, airport_access), OTA pricing with booking links, daily price calendar.

**Cost:** $0.0008/hotel (or $0.0016 with price calendar).

---

## Part 3: Schema Expansion Migration

Create migration: `supabase/migrations/20260405000000_nlp_and_new_sources.sql`

```sql
-- NLP columns on hotel_reviews
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS guest_persona JSONB;
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS content_seeds JSONB;
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS competitor_mentions JSONB;

-- Google Q&A table
CREATE TABLE IF NOT EXISTS hotel_qna (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT,
  answered_by   TEXT,
  question_date TIMESTAMPTZ,
  answer_date   TIMESTAMPTZ,
  source        TEXT DEFAULT 'google',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, question)
);
CREATE INDEX IF NOT EXISTS idx_qna_hotel ON hotel_qna(hotel_id);

-- Q&A aggregates on hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS qna_count INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS qna_unanswered_count INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS qna_response_rate REAL;

-- GMB fields on hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_is_claimed BOOLEAN;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_popular_times JSONB;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_place_topics JSONB;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_hotel_star_rating INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_book_online_url TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gmb_people_also_search JSONB;

-- Government star rating
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gov_star_rating INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gov_star_source TEXT;

-- AI visibility
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS ai_visibility_score REAL;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS ai_chatgpt_mentioned BOOLEAN;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS ai_perplexity_mentioned BOOLEAN;

-- Schema.org / digital maturity
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS dp_has_schema_hotel BOOLEAN;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS dp_schema_completeness REAL;

-- Sustainability extensions
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS cert_earthcheck BOOLEAN;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS cert_earthcheck_level TEXT;

-- Booking.com cross-platform (future, populated by Apify scraper)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS bk_rating REAL;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS bk_num_reviews INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS bk_star_rating INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS rating_divergence_ta_vs_bk REAL;

-- Hiring signals extension
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS cx_active_job_count INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS cx_hiring_departments TEXT;

-- SQL comments for new tables/columns
COMMENT ON TABLE hotel_qna IS 'Guest questions from Google Maps Q&A. Pre-booking intent signals and content gap indicators.';
COMMENT ON COLUMN hotels.gmb_is_claimed IS 'Whether the hotel has claimed their Google My Business listing. Unclaimed = low digital maturity = higher Tercier opportunity.';
COMMENT ON COLUMN hotels.gmb_popular_times IS 'Hourly foot traffic patterns by day of week from Google Maps. Proxy for occupancy patterns.';
COMMENT ON COLUMN hotels.ai_visibility_score IS 'Composite score (0-1) measuring how visible the hotel is in AI search responses (ChatGPT, Gemini, Perplexity).';
COMMENT ON COLUMN hotels.dp_has_schema_hotel IS 'Whether the hotel website has proper Schema.org Hotel JSON-LD markup. Only 10.6% of hotels do.';
COMMENT ON COLUMN hotels.bk_rating IS 'Booking.com overall rating (1-10 scale, NOT 1-5). Cross-platform comparison with TA.';
```

---

## Run Order

```bash
# 1. Apply schema migration
npx supabase db push --linked --include-all --yes

# 2. Add OPENAI_API_KEY to .env (needed for NLP pipeline)
# Sign up at https://platform.openai.com

# 3. Run NLP extraction on existing 14,720 reviews
npx tsx scripts/nlp-pipeline/extract.ts

# 4. Run new DataForSEO sources on both Kempinskis
npm run enrich -- --json '[{"name":"Kempinski Hotel Corvinus Budapest","city":"Budapest","country":"Hungary"},{"name":"The Apurva Kempinski Bali","city":"Nusa Dua","country":"Indonesia"}]'

# 5. Verify
npx tsx scripts/phase0-enrichment/verify-database.ts
```

---

## Expected Outcome

After this build:

1. **14,720 reviews processed by NLP** — each review has sentiment, topics, guest persona, competitor mentions, content seeds
2. **`review_topic_index`** populated with aspect-level sentiment data (~45,000 rows at ~3 aspects per review)
3. **Semantic search enabled** via pgvector embeddings on all reviews
4. **Google Q&A harvested** — guest questions and answers for both Kempinskis
5. **GMB data captured** — popular_times, is_claimed, place_topics
6. **Schema expanded** from 273 to ~291 columns
7. **New `hotel_qna` table** populated

**Total cost:** ~$1.53 (NLP) + ~$0.01 (DataForSEO Q&A + GMB) = **~$1.54**

This is where the dataset becomes the moat. The raw review corpus (14,720 reviews) transforms into structured intelligence: which aspects each guest segment cares about, where sentiment is drifting, what competitors guests compare to, and marketing-ready quotes in 21 languages. Nobody else has this.
