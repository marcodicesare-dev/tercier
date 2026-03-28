---
name: sales-intelligence
description: "Sales intelligence from the hotels dataset. Use this skill when generating per-hotel sales briefs, calculating opportunity scores, preparing pitch materials, handling objections from the synthetic survey, or using dataset intelligence for hotel outreach. Covers the Tercier Opportunity Score formula, conversion likelihood scoring, sales brief templates, and objection handling from 272-hotel synthetic survey."
---

# Sales Intelligence — Dataset to Revenue

## The Sales Thesis

Tercier doesn't cold-call. Tercier walks into every meeting pre-armed with intelligence the hotel has never seen about itself. The dataset powers a "show, don't tell" sales approach:

> "Your TripAdvisor ranking dropped from #9 to #14 in 90 days. Your German guests rate you 4.2 on value but 4.8 on service — that's a messaging opportunity. 38% of your reviews are in German but your website has no German content. Park Hyatt is outscoring you on room quality (4.8 vs 4.5). And when I asked ChatGPT for the best luxury hotel in Zurich, you weren't mentioned. Let me show you what we can do about all of this."

That's not a pitch. That's a demonstration.

---

## Opportunity Scoring

### Tercier Opportunity Score (TOS) — Lead Prioritization

| Factor | Weight | Signal |
|--------|--------|--------|
| Independent / small chain | 20% | No brand = no corporate marketing team |
| Low owner response rate (<30%) | 15% | Needs reputation management |
| High review volume (>200) | 10% | Has demand but doesn't optimize |
| Underranked vs. amenity potential | 15% | Better amenities than ranking suggests |
| Multi-segment guest mix (entropy > 1.5) | 10% | Complex = needs Tercier's persona intelligence |
| Multilingual reviews (3+ languages) | 10% | International guests = content challenge |
| Premium price level ($$$ or $$$$) | 10% | Can afford EUR 1,500-5K/mo |
| Competitive dense market (>50 hotels in city) | 10% | Needs differentiation urgently |

**Score range:** 0.0 - 1.0. Hotels > 0.7 are high-priority leads.

### Contract Value Estimate

```
estimated_annual_value = price_level_factor × room_tier_factor × base_price
```

| Price Level | Factor | Room Count | Tier | Base Price |
|------------|--------|-----------|------|-----------|
| $$$$ | 1.5 | 100+ | Group | EUR 3,000/mo |
| $$$$ | 1.5 | <100 | Single | EUR 2,000/mo |
| $$$ | 1.0 | 100+ | Group | EUR 2,500/mo |
| $$$ | 1.0 | <100 | Single | EUR 1,500/mo |

### Conversion Likelihood

Based on synthetic survey (272 Swiss premium hotels, 1,632 simulations):

| Segment | Buy at EUR 1,500/mo | Buy at EUR 3,000/mo | Buy at EUR 5,000/mo |
|---------|--------------------|--------------------|---------------------|
| Luxury (5-star) | ~55% | 40% | 28% |
| Upper Upscale (4-star premium) | ~50% | 35% | 15% |
| Upscale (4-star standard) | ~40% | 25% | 8% |

---

## The Sales Brief Template

For each target hotel, generate a 1-page brief:

### HEADER
- Hotel name, city, star rating, room count
- TOS score, contract value estimate, conversion likelihood

### "WHAT WE KNOW ABOUT YOU" (demonstrate intelligence)
- TripAdvisor ranking: #{rank} of {total} in {city}
- Overall rating: {rating} ({trend} over 90 days)
- Strongest dimension: {best_subrating} ({value})
- Weakest dimension: {worst_subrating} ({value})
- Guest mix: {segment_breakdown}
- Primary source markets: {top_reviewer_countries}
- Review languages: {languages} ({total} reviews)
- Brand: {brand or "Independent"}

### "WHERE YOU'RE LOSING" (create urgency)
- Competitive comparison: vs {compset_names}
- Rating gap: {rating_vs_compset} ({positive/negative} vs compset average)
- Amenity gaps: You lack {amenities competitors have}
- Content gaps: {X}% of reviews are in {language} but your website has no {language} content
- AI visibility: {ai_visibility_status} — ChatGPT {mentions/doesn't mention} your hotel
- Owner response rate: {rate}% (compset average: {compset_rate}%)

### "WHAT WE'D DO" (show the product)
- Monthly priorities based on signals
- Content examples (persona-targeted, multilingual)
- Revenue impact estimate (OTA commission savings at 5% shift)

### "THE ASK"
- EUR {price}/month for {scope}
- 60-day pilot, no long-term commitment
- First deliverable in 5 business days

---

## Objection Handling (from Synthetic Survey)

### #1 Deal Killer: "No PMS integration" (79%)

**Response:** "The first product works from publicly available data — reviews, competitor sites, AI search results, your website. No PMS connection needed. When you see results after 60 days, we can discuss PMS integration for even deeper insights. We're building on MCP (the same standard Lighthouse and Mews use) so integration will be seamless."

### #2: "Can't prove ROI" (15%)

**Response:** "We'll show you exactly which content drove which traffic. Your OTA commission on a EUR 25M property is EUR 2.25M/year. Shifting 5% to direct saves EUR 112K. Our service costs EUR 30-60K. But let's not argue numbers — let's run a 60-day pilot and measure it."

### #3: "We already have tools" (common)

**Response:** "Which tools? TrustYou tells you your score is 4.3. We tell you WHY German business travelers rate your value at 4.2 while your competitor gets 4.5, and we hand you the German-language landing page that fixes it. Lighthouse tells you competitor rates. We tell you why they're winning the guest that should be yours."

### #4: "Too expensive" (price-sensitive segments)

**Response:** "What do you pay your agency? EUR 3-8K/month for generic content that could be about any hotel. We produce persona-targeted, multilingual content specific to YOUR guests, YOUR competitors, YOUR market — for EUR 1,500-3K. It's a cost reduction with a quality upgrade."

---

## Proof Package (Ranked by Survey Weight)

1. **PMS/CRM integration path** (score: 1,089) — 45% higher than #2
2. **Swiss reference customers** (score: 752)
3. **60-day pilot option** (score: 642)
4. **GDPR/Swiss-compliant hosting** (score: 636)
5. **90-day pilot option** (score: 351)

---

## Using This Skill

Load `sales-intelligence` whenever:
- Generating per-hotel sales briefs or pitch materials
- Calculating opportunity scores or lead prioritization
- Preparing for specific hotel outreach conversations
- Handling objections from prospects
- Analyzing conversion likelihood by segment
- Building sales-facing features in the product

Pair with `hotels-dataset` for the data that powers the brief.
Pair with `tercier-knowledge` for pricing and business context.
