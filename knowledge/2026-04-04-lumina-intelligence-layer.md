# Lumina Intelligence Layer — 2026-04-04

## What We Learned

### 1. The product is not a skinny hotel row

The `hotels` table is the summary card. The product value lives in depth:

- `hotel_reviews` for the review corpus
- `hotel_qna` for pre-booking guest intent
- `hotel_competitors` for the competitive graph
- `hotel_price_snapshots` for rate history
- `hotel_metric_snapshots` for temporal reporting
- `review_topic_index` + embeddings for AI retrieval

### 2. TripAdvisor Content API is not the review backbone

TripAdvisor Content API remains critical for:

- details
- subratings
- trip types
- amenities
- ranking
- nearby competitors

It is **not** the right source for deep review harvesting.

### 3. DataForSEO is the review and intent backbone

DataForSEO now powers:

- full TripAdvisor review corpus
- full Google review corpus
- Google Q&A
- Google My Business profile signals
- SEO / paid / traffic / topic signals

This is the single most important source-stack correction made so far.

### 4. Persona intelligence belongs at the review level first

The Lumina persona layer should be extracted per review before being rolled up per hotel.

That means storing:

- `guest_persona`
- `guest_segment`
- `content_seeds`
- `competitor_mentions`
- aspect-level sentiment

on each review row, then aggregating later for product surfaces.

### 5. Resilience rules that matter

- Source failures must degrade to `skipped` whenever the provider simply has no result
- Long-running async APIs must persist local metadata so jobs can resume
- Cache raw responses before transformation
- Recompute hotel-level aggregates from child tables after writes
- Do not let dependent sources run before canonical identity fields exist

## Current Production Reality

- `hotels` table: 297 columns
- `hotel_qna` table: live
- Q&A/GMB layer: live in enrichment pipeline
- NLP pipeline: live
- `10,714` text-bearing reviews processed into sentiment, topics, persona, content seeds, competitor mentions, and embeddings
- `38,579` rows in `review_topic_index`
- `4,006` provider rows remain intentionally unprocessed because they have blank/null review text

## Follow-On Opportunities

These are real opportunities, but they are **not** yet production sources:

- TrustYou S3 meta-review dump
- HotelGrade / official star sources
- Booking.com source layer
- AI visibility audits (ChatGPT / Perplexity / Gemini)
- Schema.org extraction rollups
- hotel-level persona summary fields
