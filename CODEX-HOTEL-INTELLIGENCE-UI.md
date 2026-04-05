# Codex Agent: Hotel Intelligence UI

## What This Is

A Next.js web app that visualizes the Lumina hotel intelligence database. This is the internal tool that proves the data moat is real, and doubles as the sales demo when showing hotel chains what Lumina already knows about their properties.

**Not a generic dashboard.** Not a table viewer. Each hotel gets a rich intelligence card that tells the story the data reveals — quality fingerprint, guest personas, competitive position, sentiment analysis, content seeds, and actionable insights.

**The data is already there.** Supabase has 21 hotels, 14,720 reviews with NLP extraction, 38,579 topic rows, competitive networks, Q&A threads, amenity inventories, pricing snapshots, and 297 fields per hotel. This UI just reads it.

**Performance target: sub-100ms.** Every page must render in under 100ms. No spinners. No loading states visible to the user. The architecture uses materialized views (pre-computed aggregates), a single RPC function per hotel (one network call, all data), and Next.js Server Components (no client-side fetching).

---

## STEP 0: Database Performance Layer (RUN FIRST)

Before building the UI, create materialized views and an RPC function in Supabase. This is what makes sub-100ms possible — the dashboard reads from pre-computed aggregates, never from raw 14,720-row tables.

### Migration: `supabase/migrations/20260405100000_dashboard_views.sql`

```sql
-- ============================================================
-- MATERIALIZED VIEWS FOR DASHBOARD PERFORMANCE
-- ============================================================

-- 1. Hotel dashboard card: pre-computed summary per hotel
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hotel_dashboard AS
SELECT
  h.id AS hotel_id,
  h.name,
  h.city,
  h.country,
  h.ta_rating,
  h.gp_rating,
  h.ta_num_reviews,
  h.gp_user_rating_count,
  h.ta_ranking,
  h.ta_ranking_out_of,
  h.ta_ranking_geo,
  h.ta_brand,
  h.ta_parent_brand,
  h.ta_price_level,
  h.ta_category,
  h.score_hqi,
  h.score_tos,
  h.score_reputation_risk,
  h.score_digital_presence,
  h.ta_primary_segment,
  h.ta_segment_pct_business,
  h.ta_segment_pct_couples,
  h.ta_segment_pct_solo,
  h.ta_segment_pct_family,
  h.ta_segment_pct_friends,
  h.ta_segment_diversity,
  h.ta_subrating_location,
  h.ta_subrating_sleep,
  h.ta_subrating_rooms,
  h.ta_subrating_service,
  h.ta_subrating_value,
  h.ta_subrating_cleanliness,
  h.ta_subrating_weakest,
  h.ta_subrating_strongest,
  h.ta_subrating_range,
  h.ta_owner_response_rate,
  h.ta_review_language_count,
  h.ta_amenity_count,
  h.gp_editorial_summary,
  h.gp_review_summary_gemini,
  h.website_url,
  h.qna_count,
  h.qna_unanswered_count,
  h.gmb_is_claimed,
  h.gmb_hotel_star_rating,
  h.seo_domain_authority,
  h.dp_website_tech_cms,
  h.enrichment_status,
  h.flag_is_independent,
  h.flag_is_luxury,
  h.flag_is_premium,
  h.flag_needs_reputation_mgmt,
  h.flag_tercier_high_priority,
  (SELECT count(*) FROM hotel_reviews r WHERE r.hotel_id = h.id) AS total_reviews_db,
  (SELECT count(*) FROM hotel_reviews r WHERE r.hotel_id = h.id AND r.sentiment = 'positive') AS positive_reviews,
  (SELECT count(*) FROM hotel_reviews r WHERE r.hotel_id = h.id AND r.sentiment = 'negative') AS negative_reviews,
  (SELECT count(*) FROM hotel_competitors c WHERE c.hotel_id = h.id) AS competitor_count,
  (SELECT count(*) FROM review_topic_index t WHERE t.hotel_id = h.id) AS topic_mentions_total
FROM hotels h
WHERE h.enrichment_status IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hotel_dashboard_id ON mv_hotel_dashboard(hotel_id);

-- 2. Topic aggregation per hotel
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hotel_topics AS
SELECT
  hotel_id,
  aspect,
  count(*) AS mention_count,
  count(*) FILTER (WHERE sentiment = 'positive') AS positive_count,
  count(*) FILTER (WHERE sentiment = 'negative') AS negative_count,
  count(*) FILTER (WHERE sentiment = 'neutral') AS neutral_count,
  round(100.0 * count(*) FILTER (WHERE sentiment = 'positive') / NULLIF(count(*), 0), 1) AS positive_pct,
  round(100.0 * count(*) FILTER (WHERE sentiment = 'negative') / NULLIF(count(*), 0), 1) AS negative_pct,
  round(avg(sentiment_score)::numeric, 3) AS avg_sentiment_score
FROM review_topic_index
GROUP BY hotel_id, aspect;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hotel_topics_pk ON mv_hotel_topics(hotel_id, aspect);

-- 3. Review timeline: monthly aggregation for charts
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_review_timeline AS
SELECT
  hotel_id,
  date_trunc('month', published_date)::date AS month,
  count(*) AS review_count,
  round(avg(rating)::numeric, 2) AS avg_rating,
  count(*) FILTER (WHERE sentiment = 'positive') AS positive,
  count(*) FILTER (WHERE sentiment = 'negative') AS negative,
  count(*) FILTER (WHERE sentiment = 'neutral') AS neutral
FROM hotel_reviews
WHERE published_date IS NOT NULL
GROUP BY hotel_id, date_trunc('month', published_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_review_timeline_pk ON mv_review_timeline(hotel_id, month);

-- 4. Guest segment distribution from review personas
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_guest_personas AS
SELECT
  hotel_id,
  guest_persona->>'occasion' AS occasion,
  guest_persona->>'spending_level' AS spending_level,
  guest_persona->>'group_detail' AS group_detail,
  count(*) AS review_count,
  round(avg(rating)::numeric, 2) AS avg_rating
FROM hotel_reviews
WHERE guest_persona IS NOT NULL
  AND guest_persona != 'null'::jsonb
GROUP BY hotel_id, guest_persona->>'occasion', guest_persona->>'spending_level', guest_persona->>'group_detail';

CREATE INDEX IF NOT EXISTS idx_mv_guest_personas_hotel ON mv_guest_personas(hotel_id);

-- 5. Language breakdown
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_lang_breakdown AS
SELECT
  hotel_id,
  lang,
  count(*) AS review_count,
  round(avg(rating)::numeric, 2) AS avg_rating,
  count(*) FILTER (WHERE sentiment = 'positive') AS positive,
  count(*) FILTER (WHERE sentiment = 'negative') AS negative
FROM hotel_reviews
WHERE lang IS NOT NULL
GROUP BY hotel_id, lang;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_lang_breakdown_pk ON mv_lang_breakdown(hotel_id, lang);

-- 6. Content seeds (top quotes per hotel, pre-filtered)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_content_seeds AS
SELECT
  r.hotel_id,
  seed->>'quote' AS quote,
  seed->>'emotion' AS emotion,
  seed->>'segment' AS segment,
  seed->>'use' AS marketing_use,
  r.lang,
  r.rating
FROM hotel_reviews r,
  jsonb_array_elements(r.content_seeds) AS seed
WHERE r.content_seeds IS NOT NULL
  AND jsonb_array_length(r.content_seeds) > 0;

CREATE INDEX IF NOT EXISTS idx_mv_content_seeds_hotel ON mv_content_seeds(hotel_id);

-- 7. Single RPC function: returns everything for a hotel card in ONE call
CREATE OR REPLACE FUNCTION get_hotel_card(target_hotel_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'hotel', (SELECT row_to_json(d.*) FROM mv_hotel_dashboard d WHERE d.hotel_id = target_hotel_id),
    'topics', (SELECT coalesce(jsonb_agg(row_to_json(t.*) ORDER BY t.mention_count DESC), '[]'::jsonb) FROM mv_hotel_topics t WHERE t.hotel_id = target_hotel_id),
    'timeline', (SELECT coalesce(jsonb_agg(row_to_json(tl.*) ORDER BY tl.month), '[]'::jsonb) FROM mv_review_timeline tl WHERE tl.hotel_id = target_hotel_id),
    'competitors', (SELECT coalesce(jsonb_agg(row_to_json(cn.*) ORDER BY cn.competitor_rank), '[]'::jsonb) FROM competitive_network cn WHERE cn.hotel_id = target_hotel_id),
    'languages', (SELECT coalesce(jsonb_agg(row_to_json(lb.*) ORDER BY lb.review_count DESC), '[]'::jsonb) FROM mv_lang_breakdown lb WHERE lb.hotel_id = target_hotel_id),
    'personas', (SELECT coalesce(jsonb_agg(row_to_json(gp.*) ORDER BY gp.review_count DESC), '[]'::jsonb) FROM mv_guest_personas gp WHERE gp.hotel_id = target_hotel_id LIMIT 20),
    'content_seeds', (SELECT coalesce(jsonb_agg(row_to_json(cs.*)), '[]'::jsonb) FROM (SELECT * FROM mv_content_seeds cs WHERE cs.hotel_id = target_hotel_id LIMIT 30) cs),
    'qna', (SELECT coalesce(jsonb_agg(row_to_json(q.*) ORDER BY q.question_date DESC), '[]'::jsonb) FROM (SELECT question, answer, answered_by, question_date FROM hotel_qna WHERE hotel_id = target_hotel_id ORDER BY question_date DESC LIMIT 10) q)
  );
$$;

-- Refresh all views (run after data changes)
-- Can also schedule with pg_cron: SELECT cron.schedule('refresh_dashboard', '0 */6 * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hotel_dashboard; REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hotel_topics; ...$$);
```

### Apply the migration:
```bash
npx supabase link --project-ref rfxuxkbfpewultpuojpe
npx supabase db push --linked --include-all --yes

# Then refresh the views with current data:
# Run in Supabase SQL Editor:
REFRESH MATERIALIZED VIEW mv_hotel_dashboard;
REFRESH MATERIALIZED VIEW mv_hotel_topics;
REFRESH MATERIALIZED VIEW mv_review_timeline;
REFRESH MATERIALIZED VIEW mv_guest_personas;
REFRESH MATERIALIZED VIEW mv_lang_breakdown;
REFRESH MATERIALIZED VIEW mv_content_seeds;
```

### Performance result:
- Portfolio grid: reads `mv_hotel_dashboard` (21 rows) — **<5ms**
- Hotel card: calls `get_hotel_card(id)` (one RPC, reads 6 materialized views) — **<15ms**
- Chart data: pre-aggregated, ~15-36 data points per chart — **zero client-side computation**
- **NEVER fetch raw `hotel_reviews` (14,720 rows) or `review_topic_index` (38,579 rows) for dashboard rendering**

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (utility-first, fast iteration)
- **Recharts** (charts — radar, bar, pie, line)
- **Supabase JS client** (reads from existing database, service role key for internal tool)
- **No auth needed** (internal tool, runs locally or on Vercel)

The Lumina visual identity from the proposal:
- **Lumina Ink:** `#1A120B` (near-black, primary text)
- **Warm Cream:** `#F5EFE6` (backgrounds)
- **Terracotta:** `#C17F59` (accents, highlights)
- **Deep Terracotta:** `#8B4A2B` (strong accent)
- **Mediterranean Gold:** `#C9A96E` (secondary accent)
- **Font:** System fonts with serif for headers (Georgia or similar), clean sans for data (Inter or system)

---

## Project Setup

Create in a NEW directory inside the repo:

```
app/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local              # SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with Lumina branding
│   │   ├── page.tsx        # Portfolio view (hotel grid)
│   │   ├── hotel/[id]/
│   │   │   └── page.tsx    # Hotel intelligence card
│   │   └── compare/
│   │       └── page.tsx    # Side-by-side comparison
│   ├── components/
│   │   ├── HotelCard.tsx           # Card in portfolio grid
│   │   ├── QualityRadar.tsx        # 6-dimension subrating radar chart
│   │   ├── GuestSegmentPie.tsx     # Trip type distribution
│   │   ├── SentimentByTopic.tsx    # Horizontal bar chart: topic × sentiment
│   │   ├── CompetitorTable.tsx     # Competitive set comparison
│   │   ├── ContentSeedsList.tsx    # Marketing-ready quotes
│   │   ├── ReviewTimeline.tsx      # Sentiment trend over time
│   │   ├── LanguageBreakdown.tsx   # Reviews by language with ratings
│   │   ├── ScoreGauges.tsx         # HQI, TOS, Reputation Risk gauges
│   │   ├── QnAList.tsx             # Google Q&A threads
│   │   └── KeyMetrics.tsx          # Big number stat cards
│   └── lib/
│       └── supabase.ts     # Supabase client
```

### package.json dependencies

```json
{
  "dependencies": {
    "next": "^15.3",
    "@supabase/supabase-js": "^2.49",
    "recharts": "^2.15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "typescript": "^5.8",
    "@types/node": "^22",
    "@types/react": "^19",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8"
  }
}
```

### .env.local (same credentials as the pipeline)

```
SUPABASE_URL=https://rfxuxkbfpewultpuojpe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeHV4a2JmcGV3dWx0cHVvanBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0MTI0MCwiZXhwIjoyMDkwODE3MjQwfQ.ZwOVbHHYfB4qmbBpSOyDceZaFSHtGB39CR_TsFaIkdA
```

---

## View 1: Portfolio Grid (`/`)

A grid of hotel cards. Each card shows:
- Hotel name + city + country
- Star rating indicators (TA + Google)
- Primary guest segment badge (e.g., "Couples 47%")
- HQI score gauge (0-1, color-coded)
- TOS score (opportunity indicator)
- Review count
- Enrichment status badge

**Data query:**
```typescript
const { data: hotels } = await supabase
  .from('hotels')
  .select('id,name,city,country,ta_rating,gp_rating,ta_num_reviews,gp_user_rating_count,ta_primary_segment,ta_segment_pct_couples,ta_segment_pct_business,ta_segment_pct_family,score_hqi,score_tos,ta_brand,ta_price_level,enrichment_status,ta_ranking,ta_ranking_out_of,ta_ranking_geo')
  .not('ta_location_id', 'is', null)
  .order('score_hqi', { ascending: false });
```

**Grid layout:** Responsive — 1 column mobile, 2 tablet, 3 desktop. Click any card → navigates to `/hotel/{id}`.

**Filters at the top:** Search by name. Filter by country, brand, price level. Sort by HQI, TOS, review count, rating.

---

## View 2: Hotel Intelligence Card (`/hotel/[id]`)

This is the main view. Everything the dataset knows about one hotel, presented as a narrative.

### Section A: Hero Header

- Hotel name (large)
- City, Country | Brand | Price level ($$$$ badge)
- Google editorial summary (italic, the one-line description)
- Two big ratings: TA rating (out of 5) and Google rating (out of 5) side by side
- Review counts: "3,333 TripAdvisor · 4,024 Google · 21 languages"
- Ranking: "#56 of 462 hotels in Budapest"

### Section B: Quality Fingerprint (Radar Chart)

6-axis radar chart with TA subratings:
- Location, Sleep, Rooms, Service, Value, Cleanliness
- Each axis 1-5, with grid lines at 4.0 and 4.5
- The SHAPE tells the story — flat = consistent, spiky = tension areas
- Below the chart: "Strongest: Location (4.9) · Weakest: Value (4.5) · Range: 0.4"
- Color: Terracotta fill with 30% opacity, Deep Terracotta stroke

### Section C: Guest Segments (Pie/Donut Chart + Stats)

Donut chart showing trip type distribution:
- Couples: 47% (dominant)
- Business: 20%
- Family: 17%
- Friends: 13%
- Solo: 4%

Below: "Primary segment: Couples · Diversity score: 1.97 (high mix)"

Color scheme: each segment gets a distinct color from the Lumina palette.

### Section D: Sentiment by Topic (Horizontal Bar Chart)

From `review_topic_index`, aggregate by aspect:
```sql
SELECT aspect,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative,
  AVG(sentiment_score) as avg_score
FROM review_topic_index
WHERE hotel_id = $1
GROUP BY aspect
ORDER BY total DESC
```

Display as horizontal stacked bars: green (positive) and red (negative) proportions per topic.
Top topics likely: staff_service, room_cleanliness, food_quality, value_for_money, location_convenience, checkin_checkout, breakfast, spa, pool.

### Section E: Competitive Position

Table of 9 competitors from `hotel_competitors` joined with `hotels`:
```sql
SELECT c.competitor_rank, c.name, c.distance_km,
  ch.ta_rating, ch.ta_num_reviews, ch.ta_subrating_service, ch.ta_subrating_value
FROM hotel_competitors c
LEFT JOIN hotels ch ON c.competitor_hotel_id = ch.id
WHERE c.hotel_id = $1
ORDER BY c.competitor_rank
```

Display as a table with color-coded cells: green if the target hotel wins on that metric, red if the competitor wins. Show rating delta in each cell.

### Section F: Review Language Breakdown

From `hotel_lang_ratings`:
```sql
SELECT lang, avg_rating, review_count
FROM hotel_lang_ratings
WHERE hotel_id = $1
ORDER BY review_count DESC
```

Bar chart: each language with count + average rating. Highlights rating divergence across markets.

### Section G: Content Seeds

Query reviews with content_seeds:
```sql
SELECT content_seeds, rating, lang, guest_persona
FROM hotel_reviews
WHERE hotel_id = $1
  AND content_seeds IS NOT NULL
  AND jsonb_array_length(content_seeds) > 0
LIMIT 50
```

Display as a list of cards, each with:
- The quote (in original language)
- Emotion tag (wonder, delight, romance, comfort)
- Target segment (couples, families, business)
- Marketing use (testimonial, visual_hero, social_proof)
- Language flag

### Section H: Google Q&A

From `hotel_qna`:
```sql
SELECT question, answer, answered_by, question_date
FROM hotel_qna
WHERE hotel_id = $1
ORDER BY question_date DESC
```

Display as an accordion or list. Questions guests actually ask before booking. Unanswered questions highlighted in red.

### Section I: Score Gauges

Three circular gauges:
- **HQI** (Hotel Quality Index): 0-1, color gradient green→yellow→red
- **TOS** (Tercier Opportunity Score): 0-1, how good a sales prospect
- **Reputation Risk**: 0-1, inverse (lower is better)

With the `score_digital_presence` as a fourth smaller gauge.

### Section J: Key Stats Grid

2x4 grid of big-number cards:
- Owner Response Rate: 95.4%
- Reviews in Last 90 Days: N
- Amenity Count: 95
- GMB Claimed: ✅
- Domain Authority: 63
- QnA Threads: 21
- Price Level: $$$$
- Tech Stack: Custom CMS

---

## View 3: Competitive Comparison (`/compare?ids=id1,id2`)

Side-by-side view of 2-3 hotels. Passed via query params.

- Overlaid radar charts (each hotel a different color)
- Rating comparison bars
- Segment distribution comparison
- Topic sentiment comparison
- Review volume comparison
- Price comparison (if price data exists)

This view is Layer 4 of the Lumina product — "Competitive Reading: your hotel vs comp set, through guest eyes."

---

## Data Fetching Pattern

**CRITICAL: Never fetch raw tables for rendering.** Always read from materialized views or the `get_hotel_card` RPC.

### Supabase client (server-only)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Service role client — ONLY use in Server Components
// SUPABASE_SERVICE_ROLE_KEY has NO NEXT_PUBLIC_ prefix = never bundled to browser
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);
```

### Portfolio page: reads from materialized view (21 rows, <5ms)

```typescript
// src/app/page.tsx (Server Component)
export default async function PortfolioPage() {
  const { data: hotels } = await supabase
    .from('mv_hotel_dashboard')
    .select('*')
    .order('score_hqi', { ascending: false });

  return <HotelGrid hotels={hotels ?? []} />;
}
```

### Hotel card: ONE RPC call, all data (<15ms)

```typescript
// src/app/hotel/[id]/page.tsx (Server Component)
export default async function HotelPage({ params }: { params: { id: string } }) {
  const { data } = await supabase.rpc('get_hotel_card', { target_hotel_id: params.id });

  // data.hotel = summary from mv_hotel_dashboard
  // data.topics = aspect sentiment from mv_hotel_topics
  // data.timeline = monthly review trend from mv_review_timeline
  // data.competitors = competitive set from competitive_network view
  // data.languages = per-language breakdown from mv_lang_breakdown
  // data.personas = guest persona aggregates from mv_guest_personas
  // data.content_seeds = marketing-ready quotes from mv_content_seeds
  // data.qna = Google Q&A threads from hotel_qna

  return (
    <div>
      <HotelHeader hotel={data.hotel} />
      <QualityRadar hotel={data.hotel} />            {/* 6 data points */}
      <GuestSegmentPie hotel={data.hotel} />          {/* 5 data points */}
      <SentimentByTopic topics={data.topics} />       {/* ~15 rows */}
      <ReviewTimeline data={data.timeline} />         {/* ~36 monthly rows */}
      <CompetitorTable competitors={data.competitors} /> {/* 9 rows */}
      <LanguageBreakdown languages={data.languages} /> {/* ~10-20 rows */}
      <ContentSeedsList seeds={data.content_seeds} />  {/* 30 quotes */}
      <QnAList questions={data.qna} />                 {/* 10 threads */}
    </div>
  );
}
```

### Chart components are 'use client' — receive pre-aggregated data as props

```typescript
// src/components/QualityRadar.tsx
'use client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export function QualityRadar({ hotel }: { hotel: HotelDashboard }) {
  const data = [
    { dimension: 'Location', value: hotel.ta_subrating_location },
    { dimension: 'Sleep', value: hotel.ta_subrating_sleep },
    { dimension: 'Rooms', value: hotel.ta_subrating_rooms },
    { dimension: 'Service', value: hotel.ta_subrating_service },
    { dimension: 'Value', value: hotel.ta_subrating_value },
    { dimension: 'Cleanliness', value: hotel.ta_subrating_cleanliness },
  ];
  // 6 data points — renders in microseconds
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid gridType="polygon" />
        <PolarAngleAxis dataKey="dimension" />
        <PolarRadiusAxis domain={[3.5, 5]} />
        <Radar dataKey="value" stroke="#C17F59" fill="#C17F59" fillOpacity={0.3} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Performance rules:
1. **`isAnimationActive={false}`** on all Recharts components — eliminates animation lag
2. **`dot={false}`** on line charts — no individual SVG elements
3. **All data is pre-aggregated** — charts receive 6-36 data points, never thousands
4. **One network call per page** — portfolio reads 1 view, hotel card calls 1 RPC
5. **Server Components** — no client-side fetch, no loading states, no spinners

---

## Design Principles

1. **Data density without clutter.** Every pixel earns its place. Show 20 data points per section, not 3.
2. **The story comes first.** Lead with the insight ("Value is your weakest dimension"), not the number ("Value: 4.5").
3. **Mediterranean warmth.** Cream backgrounds, terracotta accents, serif headers. This is a luxury hospitality tool, not a SaaS dashboard.
4. **Dark mode optional but not required.** Light/cream mode is the primary experience.
5. **Responsive but desktop-first.** This gets shown on a laptop in a meeting room.

---

## What NOT to Do

- Do NOT build auth. This is an internal tool.
- Do NOT build write/edit functionality. Read-only.
- Do NOT use a component library (shadcn, MUI). Tailwind is enough.
- Do NOT over-engineer. Server Components + Supabase + Recharts. That's it.
- Do NOT build a separate API layer. Supabase IS the API.
- Do NOT fetch data client-side. Server Components only.
- Do NOT show raw database column names in the UI. Translate to human language.
- Do NOT use the `app/` directory name — it conflicts with other tools. Use a distinct name like `dashboard/` or `lumina-ui/` for the Next.js project root.

---

## Run It

```bash
cd lumina-ui
npm install
npm run dev
# Open http://localhost:3000
```

The app reads from the live Supabase database with 21 hotels. The two Kempinskis are the showcase — click into either one to see the full intelligence card.

---

## Expected Result

When you open `http://localhost:3000`:
- Grid of 21 hotel cards, sorted by quality score
- Kempinski Budapest and Bali at the top (highest HQI)
- Click Kempinski Budapest → full intelligence card with:
  - Radar chart showing the quality fingerprint (value is weakest at 4.5)
  - Couples dominate at 47% of guests
  - 20,642 topic index rows broken down by sentiment
  - 9 competitors side-by-side with ratings
  - Content seeds in 21 languages
  - 21 Google Q&A threads
  - Score gauges: HQI 0.88, TOS 0.53, Risk 0.25

This is what you show Amedeo. This is what you show the Kempinski VP. "We already know every property in your chain better than your agency does. And this updates automatically."
