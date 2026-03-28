---
name: review-intelligence
description: "NLP review intelligence pipeline for hotels. Use this skill when extracting structured intelligence from guest reviews: topic clustering, per-segment sentiment, per-language analysis, competitive mentions, content seed extraction, emotional tone analysis, and owner response quality assessment. This skill transforms raw review corpora into the actionable intelligence that powers Tercier's 7-layer platform."
---

# Review Intelligence — NLP Pipeline

## Why Reviews Are the Core Asset

Reviews are the most valuable data in the Tercier dataset. Not because of star ratings — those are commodity data. Because of what guests WRITE. The text contains:

1. **Segment-specific expectations** — What German business travelers expect is different from Japanese honeymooners
2. **Competitive intelligence** — Guests compare hotels by name in reviews
3. **Service gap signals** — Specific complaints that map to operational improvements
4. **Content seeds** — Real guest quotes in their native language, ready for marketing
5. **Emotional patterns** — Joy, frustration, surprise, disappointment — these drive rebooking

The platform's Layer 2 (Voice-of-Customer) and Layer 3 (Persona & Intent) are built entirely from review intelligence.

---

## The NLP Extraction Pipeline

### Input

Raw review corpus from TripAdvisor (JSONL), organized by hotel. Each review has:
- `text` — full review body
- `title` — review headline
- `lang` — language code
- `rating` — 1-5 stars
- `trip_type` — Business/Couples/Solo/Family/Friends
- `subratings` — per-dimension scores (Value, Room, Location, Cleanliness, Service, Sleep)
- `user.user_location` — reviewer home location
- `travel_date` — when they stayed
- `owner_response` — hotel's reply (if any)

### Stage 1: Topic Extraction

For each hotel, cluster review mentions into topics:

**Positive topics:** (what guests love)
- Service quality, staff friendliness, specific staff names
- Location/convenience/views
- Room quality/comfort/size
- Food/breakfast/restaurant/bar
- Spa/wellness/pool
- Design/decor/ambiance
- Cleanliness
- Value for money

**Negative topics:** (what guests complain about)
- Noise (street, neighbors, AC, elevators)
- Check-in/check-out process
- WiFi quality
- Room size/condition
- Bathroom issues
- Food quality/variety
- Parking difficulties
- Hidden fees/pricing surprises
- Staff attitude
- Temperature control
- Outdated facilities

**Method:** Use LLM-based topic extraction (Claude or GPT) on batches of 20-50 reviews per hotel. Return structured JSON with topic → frequency → sentiment → example quotes.

### Stage 2: Per-Language Sentiment

For each language with 5+ reviews:
- Average rating by language
- Top 3 positive topics by language
- Top 3 negative topics by language
- Language-specific expectations (e.g., German guests care more about parking and efficiency, Japanese guests care more about quiet rooms and toiletry quality)

**Output:** `review_positive_by_language`, `review_negative_by_language` fields

### Stage 3: Per-Segment Analysis

For each trip type (Business, Couples, Solo, Family, Friends):
- What this segment values most
- What this segment complains about most
- Rating trend for this segment
- Most-mentioned amenities by segment

**Output:** `review_positive_by_segment`, `review_negative_by_segment`

### Stage 4: Competitive Mentions

Extract hotel names mentioned in reviews:
- "Better than {competitor}" patterns
- "Unlike {competitor}" comparisons
- "We also stayed at {competitor}" preferences
- Direct competitor mentions → frequency → sentiment

**Output:** `review_competitor_mentions`

### Stage 5: Content Seed Extraction

Extract the best quotes for marketing use:
- Positive quotes per language (authentic guest voice)
- Specific praise with detail (not just "great hotel" but "the concierge remembered our anniversary")
- Quotes that match specific positioning pillars
- Negative quotes that reveal positioning opportunities

**Output:** `review_content_seeds_positive`, `review_content_seeds_negative`

### Stage 6: Owner Response Analysis

For hotels with owner responses:
- Response rate (% of reviews with responses)
- Average response delay (hours)
- Response language match (does hotel respond in reviewer's language?)
- Response quality: "professional" / "templated" / "defensive" / "absent"
- Response personalization score

**Output:** `review_owner_response_quality`, `review_owner_response_language_match`

---

## Derived Intelligence Products

### Guest Expectation Matrix

Per hotel, per segment, per language:
```json
{
  "hotel_id": "196060",
  "segment": "business",
  "language": "de",
  "top_expectations": ["efficient check-in", "quiet room", "good wifi", "restaurant quality"],
  "top_satisfaction": ["service", "location", "restaurant"],
  "top_frustration": ["wifi speed", "room temperature"],
  "competitive_mentions": ["Park Hyatt", "Widder Hotel"],
  "marketing_angle": "German business travelers value efficiency and dining quality. Highlight express check-in and Pavillon restaurant."
}
```

### Content Brief Generator

From review intelligence, generate per-hotel content briefs:
- Which personas need content (based on review volume by language)
- What messaging resonates (from positive quotes)
- What objections to address (from negative patterns)
- Which languages are underserved (review languages vs website languages)
- What competitor advantages to counter (from competitive mentions)

---

## Technical Approach

### LLM-Based NLP (Recommended)

Use Claude/GPT for topic extraction. Reviews are short, unstructured text — LLMs outperform traditional NLP on hotel review analysis.

**Batch processing:** Send 20-50 reviews per LLM call with structured output schema:
```
Analyze these {count} reviews for {hotel_name}. Extract:
1. Top 5 positive topics with frequency and example quotes
2. Top 5 negative topics with frequency and example quotes
3. Competitive hotels mentioned
4. Best marketing quotes (in original language)
5. Guest expectations by trip type
Return as JSON.
```

**Cost estimate:** ~$0.01-0.03 per hotel (20-50 reviews × $0.003/1K input tokens)
At 150,000 hotels: $1,500-4,500 for full EU coverage

### Token-Efficient Strategy

Don't send full reviews to LLM. Pre-filter:
1. Remove reviews with only star rating (no text)
2. Truncate reviews to 500 chars (most signal is in first paragraph)
3. Group by language before sending
4. Cache extracted topics — only re-run when new reviews arrive

---

## Using This Skill

Load `review-intelligence` whenever:
- Building or modifying the NLP review analysis pipeline
- Designing content brief generation from review data
- Working on per-segment or per-language sentiment analysis
- Extracting marketing-ready content seeds from reviews
- Analyzing owner response patterns
- Building Layer 2 (Voice-of-Customer) or Layer 3 (Persona & Intent) features

Pair with `hotels-dataset` for schema context.
Pair with `tripadvisor-api` for review endpoint details.
