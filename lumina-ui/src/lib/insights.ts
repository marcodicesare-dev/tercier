import type {
  ChainIntelligenceRow,
  CompetitorNetworkRow,
  ContentSeedRow,
  GuestPersonaDeepDiveData,
  GuestPersonaRow,
  HotelAmenityRow,
  HotelDashboardRow,
  HotelPriceSnapshotRow,
  HotelTopicRow,
  LanguageBreakdownRow,
  ReviewTimelineRow,
} from '@/lib/types';
import { formatDecimal, formatNumber, titleCase } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const AI_QUERY_BENCHMARK = 20;

const ENGLISH_CODES = new Set(['en', 'en-us', 'en-gb', 'en-au', 'en-ca', 'english']);

const EMPTY_TOKENS = new Set(['null', 'undefined', 'unknown', 'n/a', 'na', 'none']);

/** Language display names for common ISO codes */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', ar: 'Arabic', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', zhcn: 'Chinese', 'zh-cn': 'Chinese', cn: 'Chinese',
  tr: 'Turkish', nl: 'Dutch', pl: 'Polish', sv: 'Swedish', da: 'Danish',
  no: 'Norwegian', fi: 'Finnish', cs: 'Czech', sk: 'Slovak', hu: 'Hungarian',
  he: 'Hebrew', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', in: 'Indonesian',
  ms: 'Malay', el: 'Greek', ro: 'Romanian', bg: 'Bulgarian', hr: 'Croatian',
  uk: 'Ukrainian', hi: 'Hindi',
};

function langName(code: string): string {
  const normalized = code.trim().toLowerCase().replace(/-/g, '');
  return LANGUAGE_NAMES[normalized] ?? LANGUAGE_NAMES[normalized.slice(0, 2)] ?? titleCase(code);
}

function normalizeTextToken(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (EMPTY_TOKENS.has(normalized.toLowerCase())) return null;
  return normalized;
}

function roundScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function positiveDelta(current: number | null | undefined, comparison: number | null | undefined): number | null {
  if (current == null || comparison == null) return null;
  return current - comparison;
}

/**
 * Deduplicate locale variants into base languages.
 * "en | en-gb" → ["en"]  (1 effective language, not 2)
 */
function getEffectiveWebsiteLanguages(raw: string | null | undefined): string[] {
  const codes = (raw ?? '')
    .split(/[,|/]/)
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  const bases = new Set<string>();
  for (const code of codes) {
    if (ENGLISH_CODES.has(code)) {
      bases.add('en');
    } else {
      // Take the base language from locale codes like de-de, zh-cn
      bases.add(code.split('-')[0]);
    }
  }
  return [...bases];
}

function getEffectiveWebsiteLanguageCount(hotel: HotelDashboardRow): number {
  // Use the computed column from the intelligence layer if available
  if ((hotel as any).computed_effective_website_langs > 0) {
    return (hotel as any).computed_effective_website_langs;
  }
  return getEffectiveWebsiteLanguages(hotel.dp_website_content_languages).length;
}

function shouldUseComputedOpportunityNarrative(hotel: HotelDashboardRow, narrative: string | null | undefined): boolean {
  if (typeof narrative !== 'string' || narrative.trim().length < 10) return false;

  const effectiveLangs = getEffectiveWebsiteLanguageCount(hotel);
  if (effectiveLangs === 0 && /\bserves 0\b/i.test(narrative)) {
    return false;
  }

  if ((hotel.total_reviews_db ?? 0) === 0 && /\breviews?\b/i.test(narrative)) {
    return false;
  }

  return true;
}

function isEnglishLanguage(value: string | null | undefined): boolean {
  if (!value) return false;
  return ENGLISH_CODES.has(value.trim().toLowerCase());
}

function segmentRank(hotel: HotelDashboardRow): Array<{ label: string; value: number }> {
  return [
    { label: 'Family', value: hotel.ta_segment_pct_family ?? 0 },
    { label: 'Couples', value: hotel.ta_segment_pct_couples ?? 0 },
    { label: 'Business', value: hotel.ta_segment_pct_business ?? 0 },
    { label: 'Friends', value: hotel.ta_segment_pct_friends ?? 0 },
    { label: 'Solo', value: hotel.ta_segment_pct_solo ?? 0 },
  ]
    .filter(item => item.value > 0)
    .sort((left, right) => right.value - left.value);
}

function getSubratingRows(hotel: HotelDashboardRow): Array<{ label: string; value: number }> {
  const rows: Array<{ label: string; value: number }> = [];
  const candidates = [
    { label: 'Service', value: hotel.ta_subrating_service },
    { label: 'Location', value: hotel.ta_subrating_location },
    { label: 'Rooms', value: hotel.ta_subrating_rooms },
    { label: 'Cleanliness', value: hotel.ta_subrating_cleanliness },
    { label: 'Sleep', value: hotel.ta_subrating_sleep },
    { label: 'Value', value: hotel.ta_subrating_value },
  ];

  for (const candidate of candidates) {
    if (typeof candidate.value === 'number') {
      rows.push({ label: candidate.label, value: candidate.value });
    }
  }

  return rows;
}

function getBestAndWorstTopic(topics: HotelTopicRow[]) {
  const ranked = topics
    .filter(topic => topic.mention_count >= 5)
    .map(topic => ({
      ...topic,
      positiveRate: topic.positive_pct ?? (topic.positive_count / Math.max(topic.mention_count, 1) * 100),
      negativeRate: topic.negative_pct ?? (topic.negative_count / Math.max(topic.mention_count, 1) * 100),
    }));

  const strongestPraise = [...ranked].sort((left, right) => right.positiveRate - left.positiveRate)[0] ?? null;
  const biggestConcern = [...ranked].sort((left, right) => right.negativeRate - left.negativeRate)[0] ?? null;

  return { strongestPraise, biggestConcern };
}

/**
 * Get non-English languages that have significant review volume
 * but are NOT served by the website.
 */
function getUnservedLanguageMarkets(
  languages: LanguageBreakdownRow[],
  websiteLanguages: string[],
): LanguageBreakdownRow[] {
  const supported = new Set(websiteLanguages);
  return languages
    .filter(language => {
      const code = language.lang.trim().toLowerCase();
      // Skip English — always assumed covered
      if (isEnglishLanguage(code)) return false;
      // Skip if the base language matches any website language
      const base = code.split('-')[0];
      return !supported.has(code) && !supported.has(base) &&
        ![...supported].some(item => item.startsWith(base) || base.startsWith(item));
    })
    .sort((left, right) => right.review_count - left.review_count);
}


// ---------------------------------------------------------------------------
// Per-hotel insight generators (existing API, improved implementations)
// ---------------------------------------------------------------------------

/**
 * One-line opportunity insight for portfolio cards.
 * Uses pre-computed opportunity data if available, otherwise falls through priority logic.
 */
export function getCardOpportunityInsight(hotel: HotelDashboardRow): string {
  const computed = (hotel as any).computed_opportunity_narrative;
  if (shouldUseComputedOpportunityNarrative(hotel, computed)) {
    return computed;
  }

  if (typeof hotel.ai_visibility_score === 'number' && hotel.ai_visibility_score < 0.3) {
    const invisible = Math.max(0, AI_QUERY_BENCHMARK - Math.round(hotel.ai_visibility_score * AI_QUERY_BENCHMARK));
    return `Invisible to ChatGPT on ${invisible}/${AI_QUERY_BENCHMARK} discovery queries.`;
  }

  const effectiveLangs = getEffectiveWebsiteLanguageCount(hotel);
  const reviewLangs = hotel.ta_review_language_count ?? 0;
  if (reviewLangs > effectiveLangs * 2 && effectiveLangs > 0) {
    return `Guests review in ${reviewLangs} languages, website effectively serves ${effectiveLangs}.`;
  }

  if (
    hotel.ta_subrating_weakest === 'value' &&
    typeof hotel.ta_subrating_service === 'number' &&
    typeof hotel.ta_subrating_value === 'number' &&
    (hotel.ta_subrating_range ?? 0) > 0.3
  ) {
    const gap = hotel.ta_subrating_service - hotel.ta_subrating_value;
    return `Value rated ${formatDecimal(gap, 1)} points below service — a pricing perception gap.`;
  }

  if (typeof hotel.ta_owner_response_rate === 'number' && hotel.ta_owner_response_rate < 0.3) {
    return `Only ${Math.round(hotel.ta_owner_response_rate * 100)}% of reviews get responses.`;
  }

  const ratingDelta = positiveDelta(hotel.ta_rating, hotel.ta_compset_avg_rating);
  if (ratingDelta != null && ratingDelta < -0.2) {
    return `Rating sits ${formatDecimal(Math.abs(ratingDelta), 1)} points below the competitive set average.`;
  }

  if ((hotel.ta_reviews_last_90d_est ?? 0) > 0) {
    return `${formatNumber(hotel.ta_reviews_last_90d_est)} reviews landed in the last 90 days.`;
  }

  return `${formatNumber(hotel.total_reviews_db)} reviews across ${formatNumber(hotel.ta_review_language_count)} languages and ${formatNumber(hotel.competitor_count)} competitors mapped.`;
}

export function getQualityInsight(hotel: HotelDashboardRow): string {
  const strongest = hotel.ta_subrating_strongest ? titleCase(hotel.ta_subrating_strongest) : null;
  const weakest = hotel.ta_subrating_weakest ? titleCase(hotel.ta_subrating_weakest) : null;

  if (
    hotel.ta_subrating_weakest === 'value' &&
    typeof hotel.ta_subrating_service === 'number' &&
    typeof hotel.ta_subrating_value === 'number'
  ) {
    const gap = hotel.ta_subrating_service - hotel.ta_subrating_value;
    return `Value is ${formatDecimal(gap, 1)} points below service. Guests love the experience but feel they are overpaying.`;
  }

  if (strongest && weakest && hotel.ta_subrating_range != null) {
    return `${strongest} leads ${weakest.toLowerCase()} by ${formatDecimal(hotel.ta_subrating_range, 1)} points, the clearest quality gap guests feel on property.`;
  }

  const subratings = getSubratingRows(hotel);
  if (subratings.length >= 2) {
    const ranked = [...subratings].sort((left, right) => right.value - left.value);
    const gap = ranked[0].value - ranked[ranked.length - 1].value;
    return `${ranked[0].label} is the clear strength, while ${ranked[ranked.length - 1].label.toLowerCase()} trails by ${formatDecimal(gap, 1)} points.`;
  }

  const quality = roundScore(hotel.score_hqi);
  return quality != null
    ? `Overall quality lands at ${quality}/100.`
    : 'Quality signal is available but the biggest gap is not yet clear.';
}

/**
 * Guest persona / segment insight.
 * Fixes the "Null · Null · Null" bug by filtering out all-null personas
 * and falling back to TripAdvisor segment data.
 */
export function getWhoStaysInsight(
  hotel: HotelDashboardRow,
  personas: GuestPersonaRow[],
  deepDive: GuestPersonaDeepDiveData,
): string {
  // Only use personas where at least one dimension is non-null
  const validPersonas = personas.filter(persona => Boolean(getPersonaLabel(persona)));
  const topPersona = validPersonas[0] ?? null;
  const primarySegment = hotel.ta_primary_segment ? titleCase(hotel.ta_primary_segment) : null;

  if (topPersona) {
    const label = getPersonaLabel(topPersona)!;
    return `${label} is the dominant persona, backed by ${formatNumber(topPersona.review_count)} reviews and an average rating of ${formatDecimal(topPersona.avg_rating, 1)}.`;
  }

  // Fall back to TripAdvisor segment data (always populated)
  const rankedSegments = segmentRank(hotel);
  if (rankedSegments.length >= 2) {
    return `${rankedSegments[0].label} travelers dominate at ${Math.round(rankedSegments[0].value * 100)}%, followed by ${rankedSegments[1].label} at ${Math.round(rankedSegments[1].value * 100)}%.`;
  }

  if (primarySegment && deepDive.repeatGuestPct != null && deepDive.repeatGuestPct > 0) {
    return `${primarySegment} lead the mix, and ${Math.round(deepDive.repeatGuestPct * 100)}% of persona-tagged reviews come from repeat guests.`;
  }

  if (primarySegment) {
    return `${primarySegment} is the clearest guest segment in the review mix.`;
  }

  return 'The guest mix is visible, but no single persona dominates the review corpus yet.';
}

export function getCompetitiveInsight(hotel: HotelDashboardRow, competitors: CompetitorNetworkRow[]): string {
  const delta = positiveDelta(hotel.ta_rating, hotel.ta_compset_avg_rating);
  const aboveAverage = getSubratingRows(hotel)
    .filter(row => {
      const peerAverage = competitors
        .map(competitor => {
          if (row.label === 'Service') return competitor.competitor_service_score;
          if (row.label === 'Value') return competitor.competitor_value_score;
          return null;
        })
        .filter((value): value is number => typeof value === 'number');
      if (!peerAverage.length) return false;
      const avg = peerAverage.reduce((sum, value) => sum + value, 0) / peerAverage.length;
      return row.value > avg;
    })
    .map(row => row.label);

  if (delta != null) {
    const direction = delta >= 0 ? 'above' : 'below';
    const strength = aboveAverage.length ? ` Strongest edge: ${aboveAverage.slice(0, 2).join(', ')}.` : '';
    return `This hotel sits ${formatDecimal(Math.abs(delta), 1)} points ${direction} the competitive-set average.${strength}`;
  }

  return `${formatNumber(competitors.length)} nearby competitors are mapped, giving sales and strategy a concrete set to compare against.`;
}

export function getTopicInsight(topics: HotelTopicRow[]): string {
  const { strongestPraise, biggestConcern } = getBestAndWorstTopic(topics);

  if (strongestPraise && biggestConcern && biggestConcern.aspect !== strongestPraise.aspect) {
    return `Strongest praise: ${titleCase(strongestPraise.aspect)} (${Math.round(strongestPraise.positiveRate)}% positive). Biggest concern: ${titleCase(biggestConcern.aspect)} (${Math.round(biggestConcern.negativeRate)}% negative).`;
  }

  if (strongestPraise) {
    return `${titleCase(strongestPraise.aspect)} drives the clearest positive signal at ${Math.round(strongestPraise.positiveRate)}% positive.`;
  }

  return 'Topic coverage exists, but no single aspect clearly leads or drags sentiment yet.';
}

/**
 * Language opportunity insight.
 * Fixed: deduplicates en/en-gb, never flags English as "uncovered",
 * uses proper language names instead of ISO codes.
 */
export function getLanguageInsight(
  hotel: HotelDashboardRow,
  languages: LanguageBreakdownRow[],
): string {
  const websiteLanguages = getEffectiveWebsiteLanguages(hotel.dp_website_content_languages);
  const websiteLanguageCount = websiteLanguages.length;

  if (websiteLanguageCount <= 0) {
    return 'Website language coverage has not been analyzed yet.';
  }

  const unserved = getUnservedLanguageMarkets(languages, websiteLanguages);
  if (unserved.length > 0) {
    const topGaps = unserved
      .slice(0, 3)
      .map(language => `${langName(language.lang)} (${formatNumber(language.review_count)} reviews, avg ${formatDecimal(language.avg_rating, 1)})`);
    const coverage = websiteLanguageCount === 1
      ? 'the site effectively serves English only'
      : `the site serves ${websiteLanguageCount} languages`;
    return `Review demand is strongest in ${topGaps.join(', ')}, but ${coverage}.`;
  }

  return `Language demand is spread across ${formatNumber(hotel.ta_review_language_count)} review languages.`;
}

export function getAiVisibilityInsight(hotel: HotelDashboardRow, competitorAverage: number | null): string {
  const score = hotel.ai_visibility_score;
  const delta = positiveDelta(score, competitorAverage);

  if (typeof score === 'number' && score < 0.3) {
    const invisible = Math.max(0, AI_QUERY_BENCHMARK - Math.round(score * AI_QUERY_BENCHMARK));
    return `This hotel is effectively missing from AI discovery, invisible on ${invisible}/${AI_QUERY_BENCHMARK} benchmark queries.`;
  }

  if (delta != null && delta < 0) {
    return `AI visibility trails the mapped competitive set by ${formatDecimal(Math.abs(delta), 2)} points.`;
  }

  if (hotel.ai_chatgpt_mentioned === false && hotel.ai_perplexity_mentioned === false) {
    return 'Neither ChatGPT nor Perplexity currently surfaces this hotel in cached discovery checks.';
  }

  return 'AI discovery data has not been collected yet for this property.';
}

export function getPersonaLabel(persona: Pick<GuestPersonaRow, 'occasion' | 'group_detail' | 'spending_level'>): string | null {
  const parts = [
    normalizeTextToken(persona.occasion),
    normalizeTextToken(persona.group_detail),
    normalizeTextToken(persona.spending_level),
  ]
    .filter((value): value is string => Boolean(value))
    .map(value => titleCase(value));

  return parts.length ? parts.join(' · ') : null;
}

export function getPricingInsight(hotel: HotelDashboardRow, snapshots: HotelPriceSnapshotRow[]): string {
  const latest = snapshots.at(-1);
  const direct = latest?.price_direct ?? hotel.price_direct;
  const lowestOta = latest?.price_lowest_ota ?? hotel.price_lowest_ota;
  const parity = latest?.price_parity_score ?? hotel.price_parity_score;

  if (direct != null && lowestOta != null) {
    const delta = direct - lowestOta;
    if (Math.abs(delta) >= 10) {
      return delta > 0
        ? `Direct is priced ${Math.round(delta)} above the cheapest OTA — potential margin leakage to intermediaries.`
        : `Direct undercuts OTAs by ${Math.round(Math.abs(delta))} — strong direct booking incentive.`;
    }
    return 'Direct and OTA pricing are in near-parity.';
  }

  if (parity != null) {
    return parity > 1.03
      ? `Parity is loose at ${formatDecimal(parity, 2)}. OTAs are likely undercutting direct.`
      : `Parity is relatively clean at ${formatDecimal(parity, 2)}.`;
  }

  return 'Rate checks are available, but the direct-vs-OTA story is still thin.';
}

export function getDigitalOperationalInsight(
  hotel: HotelDashboardRow,
  amenities: HotelAmenityRow[],
): string {
  const websiteLanguageCount = getEffectiveWebsiteLanguageCount(hotel);
  const amenitiesCount = amenities.length || hotel.ta_amenity_count || 0;

  if (
    (hotel.ta_review_language_count ?? 0) > Math.max(websiteLanguageCount, 0) * 2 &&
    websiteLanguageCount > 0
  ) {
    return `The digital stack is underserving demand: ${formatNumber(hotel.ta_review_language_count)} guest languages vs ${formatNumber(websiteLanguageCount)} website language${websiteLanguageCount === 1 ? '' : 's'}.`;
  }

  if (hotel.gmb_is_claimed === false) {
    return 'The Google Business profile is still unclaimed, leaving an avoidable discovery gap.';
  }

  if (hotel.dp_has_schema_hotel === false || (hotel.dp_schema_completeness ?? 1) < 0.65) {
    return `Structured data coverage is thin at ${Math.round((hotel.dp_schema_completeness ?? 0) * 100)}%, which weakens search and AI understanding.`;
  }

  if ((hotel.cx_active_job_count ?? 0) > 0) {
    return `${formatNumber(hotel.cx_active_job_count)} open roles suggest the property is actively growing or stretched operationally.`;
  }

  return `${formatNumber(amenitiesCount)} amenities catalogued, DA ${formatNumber(hotel.seo_domain_authority)}.`;
}

export function getContentSeedInsight(seeds: ContentSeedRow[]): string {
  // Filter garbage seeds before counting
  const quality = seeds.filter(s => {
    if (!s.quote) return false;
    if (s.quote.length < 25) return false;
    if (s.quote === s.quote.toUpperCase() && s.quote.length > 5) return false;
    return true;
  });

  if (quality.length === 0) {
    return 'No high-quality guest quotes have been extracted yet.';
  }

  const emotions = new Map<string, number>();
  for (const s of quality) {
    if (s.emotion) emotions.set(s.emotion, (emotions.get(s.emotion) ?? 0) + 1);
  }
  const topEmotion = [...emotions.entries()].sort((a, b) => b[1] - a[1])[0];

  return `${quality.length} marketing-ready guest quotes extracted. ${topEmotion ? `Dominant tone: ${topEmotion[0]} (${topEmotion[1]} quotes).` : ''}`;
}

export function getContactInsight(hotel: HotelDashboardRow): string {
  if (hotel.cx_gm_name && hotel.cx_gm_confidence) {
    return `${hotel.cx_gm_name} is identified as the GM with ${hotel.cx_gm_confidence.toLowerCase()} confidence.`;
  }

  if ((hotel.cx_active_job_count ?? 0) > 0) {
    return `${formatNumber(hotel.cx_active_job_count)} open roles make this property look commercially active right now.`;
  }

  return 'A contact trail exists for this property, even if the final decision-maker is not fully verified yet.';
}


// ---------------------------------------------------------------------------
// NEW: Opportunity narrative generators
// ---------------------------------------------------------------------------

export interface OpportunityNarrative {
  score: number;
  primaryReason: string;
  narrative: string;
  action: string;
}

/**
 * Full opportunity narrative for a hotel — "Why Lumina matters for this hotel."
 * Returns score, primary reason, narrative explanation, and recommended action.
 */
export function getOpportunityNarrative(
  hotel: HotelDashboardRow,
  languages: LanguageBreakdownRow[],
  topics: HotelTopicRow[],
): OpportunityNarrative {
  const signals: Array<{ reason: string; score: number; narrative: string; action: string }> = [];

  // 1. Language gap
  const effectiveLangs = getEffectiveWebsiteLanguageCount(hotel);
  const reviewLangs = hotel.ta_review_language_count ?? 0;
  const langGap = Math.max(reviewLangs - effectiveLangs, 0);
  if (effectiveLangs > 0 && langGap > 0) {
    const unserved = getUnservedLanguageMarkets(languages,
      getEffectiveWebsiteLanguages(hotel.dp_website_content_languages));
    const topLang = unserved[0];
    const langNarrative = topLang
      ? `${formatNumber(topLang.review_count)} guests reviewed in ${langName(topLang.lang)} (avg ${formatDecimal(topLang.avg_rating, 1)}) but the website has no ${langName(topLang.lang)} content.`
      : `Guests review in ${reviewLangs} languages but the website serves ${effectiveLangs}.`;
    signals.push({
      reason: 'language_gap',
      score: Math.min(langGap / 10, 1),
      narrative: langNarrative,
      action: topLang
        ? `Deploy ${langName(topLang.lang)} landing pages targeting the ${formatNumber(topLang.review_count)} guest reviews in that market.`
        : `Analyze top unserved language markets and deploy localized landing pages.`,
    });
  }

  // 2. Value perception gap
  if (hotel.ta_subrating_service != null && hotel.ta_subrating_value != null) {
    const valueGap = hotel.ta_subrating_service - hotel.ta_subrating_value;
    if (valueGap > 0.2) {
      signals.push({
        reason: 'value_gap',
        score: Math.min(valueGap / 0.6, 1),
        narrative: `Guests rate value ${formatDecimal(valueGap, 1)} points below service. The experience is strong but guests feel they overpay.`,
        action: 'Reframe value messaging: highlight inclusions, packages, and experience-per-euro instead of rates.',
      });
    }
  }

  // 3. Owner response rate
  if (hotel.ta_owner_response_rate != null && hotel.ta_owner_response_rate < 0.3) {
    signals.push({
      reason: 'response_rate',
      score: 1 - hotel.ta_owner_response_rate,
      narrative: `Only ${Math.round(hotel.ta_owner_response_rate * 100)}% of reviews get a response. Every unanswered negative review is a conversion leak.`,
      action: 'Implement review response workflow — prioritize negative reviews in the top 3 languages.',
    });
  }

  // 4. Competitive position
  if (hotel.ta_rating != null && hotel.ta_compset_avg_rating != null) {
    const compDelta = hotel.ta_compset_avg_rating - hotel.ta_rating;
    if (compDelta > 0.1) {
      signals.push({
        reason: 'competitive_position',
        score: Math.min(compDelta / 0.5, 1),
        narrative: `Rating sits ${formatDecimal(compDelta, 1)} points below the competitive set average. Guests choosing between options see this gap.`,
        action: 'Focus on the weakest subrating to close the gap, and generate fresh positive reviews.',
      });
    }
  }

  // 5. Topic weakness
  const { biggestConcern } = getBestAndWorstTopic(topics);
  if (biggestConcern && biggestConcern.negativeRate > 20) {
    signals.push({
      reason: 'topic_weakness',
      score: Math.min(biggestConcern.negativeRate / 50, 1),
      narrative: `${titleCase(biggestConcern.aspect)} is flagged negative in ${Math.round(biggestConcern.negativeRate)}% of mentions — the biggest operational drag in the review corpus.`,
      action: `Address ${titleCase(biggestConcern.aspect).toLowerCase()} operationally, then use fresh positive reviews to dilute the negative signal.`,
    });
  }

  // 6. Content maturity (thin seed library)
  const seedCount = hotel.topic_mentions_total; // Proxy: topic mentions correlate with NLP depth
  if (seedCount === 0) {
    signals.push({
      reason: 'content_gap',
      score: 0.6,
      narrative: 'No NLP-extracted content intelligence is available yet for this property.',
      action: 'Run NLP pipeline to extract topics, personas, and content seeds from the review corpus.',
    });
  }

  // Sort by score, pick the top one
  signals.sort((a, b) => b.score - a.score);
  const top = signals[0];

  if (!top) {
    return {
      score: 0,
      primaryReason: 'strong_position',
      narrative: 'This hotel scores well across all measured dimensions.',
      action: 'Maintain current strategy and monitor for shifts.',
    };
  }

  // Composite score from all signals (weighted average)
  const composite = signals.reduce((sum, s) => sum + s.score, 0) / Math.max(signals.length * 1.5, 1);

  return {
    score: Math.min(Math.round(composite * 100) / 100, 1),
    primaryReason: top.reason,
    narrative: top.narrative,
    action: top.action,
  };
}


// ---------------------------------------------------------------------------
// NEW: Quality narrative
// ---------------------------------------------------------------------------

/**
 * "What's strong, what's weak, and what it means" — 2-3 sentences.
 */
export function getQualityNarrative(hotel: HotelDashboardRow, topics: HotelTopicRow[]): string {
  const parts: string[] = [];

  // Rating context
  if (hotel.ta_rating != null) {
    const rankStr = hotel.ta_ranking != null && hotel.ta_ranking_out_of != null && hotel.ta_ranking_geo
      ? ` (#${hotel.ta_ranking} of ${formatNumber(hotel.ta_ranking_out_of)} in ${hotel.ta_ranking_geo})`
      : '';
    parts.push(`TripAdvisor ${formatDecimal(hotel.ta_rating, 1)}${rankStr}.`);
  }

  // Subrating narrative
  const subratings = getSubratingRows(hotel);
  if (subratings.length >= 3) {
    const sorted = [...subratings].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const gap = best.value - worst.value;
    if (gap > 0.2) {
      parts.push(`${best.label} leads at ${formatDecimal(best.value, 1)}, while ${worst.label.toLowerCase()} trails at ${formatDecimal(worst.value, 1)} (${formatDecimal(gap, 1)}-point spread).`);
    } else {
      parts.push(`Subratings are tightly clustered (${formatDecimal(gap, 1)}-point spread) — no dramatic weak spot.`);
    }
  }

  // Topic color
  const { strongestPraise, biggestConcern } = getBestAndWorstTopic(topics);
  if (strongestPraise && biggestConcern && strongestPraise.aspect !== biggestConcern.aspect) {
    parts.push(`In reviews, ${titleCase(strongestPraise.aspect).toLowerCase()} is praised most (${Math.round(strongestPraise.positiveRate)}% positive), while ${titleCase(biggestConcern.aspect).toLowerCase()} draws the most criticism (${Math.round(biggestConcern.negativeRate)}% negative).`);
  }

  return parts.join(' ') || getQualityInsight(hotel);
}


// ---------------------------------------------------------------------------
// NEW: Guest narrative
// ---------------------------------------------------------------------------

/**
 * "Who stays here, what they want, what they're not getting" — 2-3 sentences.
 */
export function getGuestNarrative(
  hotel: HotelDashboardRow,
  personas: GuestPersonaRow[],
  deepDive: GuestPersonaDeepDiveData,
): string {
  const parts: string[] = [];

  // Primary segment
  const ranked = segmentRank(hotel);
  if (ranked.length >= 2) {
    parts.push(`The guest mix skews ${ranked[0].label.toLowerCase()} (${Math.round(ranked[0].value * 100)}%), with ${ranked[1].label.toLowerCase()} close behind at ${Math.round(ranked[1].value * 100)}%.`);
  }

  // Spending level from persona data
  if (deepDive.spendingLevels.length > 0) {
    const top = deepDive.spendingLevels[0];
    parts.push(`Most persona-tagged reviews indicate ${top.label} spending (${Math.round(top.pct * 100)}%).`);
  }

  // Repeat guest insight
  if (deepDive.repeatGuestPct != null && deepDive.repeatGuestPct > 0.05) {
    parts.push(`${Math.round(deepDive.repeatGuestPct * 100)}% of analyzed reviews are from repeat guests — a loyalty signal.`);
  }

  // Content gap: which segments lack targeted content?
  if (ranked.length >= 2 && hotel.total_reviews_db > 100) {
    const secondarySegment = ranked[1].label;
    parts.push(`The ${secondarySegment.toLowerCase()} segment (${Math.round(ranked[1].value * 100)}%) may be underserved in current marketing content.`);
  }

  return parts.join(' ') || getWhoStaysInsight(hotel, personas, deepDive);
}


// ---------------------------------------------------------------------------
// NEW: Competitive narrative
// ---------------------------------------------------------------------------

/**
 * "Where this hotel wins and loses vs the competitive set" — 2-3 sentences.
 */
export function getCompetitiveNarrative(
  hotel: HotelDashboardRow,
  competitors: CompetitorNetworkRow[],
): string {
  if (!competitors.length) return 'No competitive set has been mapped yet.';

  const parts: string[] = [];

  // Overall position
  const delta = positiveDelta(hotel.ta_rating, hotel.ta_compset_avg_rating);
  if (delta != null) {
    if (delta >= 0.3) {
      parts.push(`This hotel leads its competitive set by ${formatDecimal(delta, 1)} points — a strong position to defend.`);
    } else if (delta >= 0) {
      parts.push(`Rating sits ${formatDecimal(delta, 1)} points above the set average — competitive but not dominant.`);
    } else {
      parts.push(`Rating is ${formatDecimal(Math.abs(delta), 1)} points below the set average — guests choosing between options see this gap.`);
    }
  }

  // Find specific competitor threats
  const betterRated = competitors.filter(c => c.competitor_rating != null && hotel.ta_rating != null && c.competitor_rating > hotel.ta_rating);
  const moreReviewed = competitors.filter(c => c.competitor_reviews != null && hotel.ta_num_reviews != null && c.competitor_reviews > hotel.ta_num_reviews);

  if (betterRated.length > 0) {
    const topThreat = betterRated.sort((a, b) => (b.competitor_rating ?? 0) - (a.competitor_rating ?? 0))[0];
    parts.push(`${topThreat.competitor_name} leads at ${formatDecimal(topThreat.competitor_rating, 1)} with ${formatNumber(topThreat.competitor_reviews)} reviews.`);
  }

  if (moreReviewed.length > 0 && betterRated.length === 0) {
    parts.push(`${moreReviewed.length} competitor${moreReviewed.length > 1 ? 's' : ''} have more reviews — higher visibility in search results.`);
  }

  return parts.join(' ') || getCompetitiveInsight(hotel, competitors);
}


// ---------------------------------------------------------------------------
// NEW: Language opportunity narrative
// ---------------------------------------------------------------------------

/**
 * "The revenue sitting on the table in underserved languages" — with concrete numbers.
 */
export function getLanguageNarrative(
  hotel: HotelDashboardRow,
  languages: LanguageBreakdownRow[],
): string {
  const websiteLanguages = getEffectiveWebsiteLanguages(hotel.dp_website_content_languages);
  const unserved = getUnservedLanguageMarkets(languages, websiteLanguages);

  if (unserved.length === 0) {
    if (languages.length <= 1) return 'Review language data is limited for this property.';
    return `Reviews span ${languages.length} languages, and the website covers the primary markets.`;
  }

  const parts: string[] = [];

  // Headline
  const totalUnservedReviews = unserved.reduce((sum, l) => sum + l.review_count, 0);
  parts.push(`${formatNumber(totalUnservedReviews)} reviews across ${unserved.length} languages have no corresponding website content.`);

  // Top 3 unserved markets
  const topMarkets = unserved.slice(0, 3);
  for (const market of topMarkets) {
    const ratingStr = market.avg_rating != null ? `, avg rating ${formatDecimal(market.avg_rating, 1)}` : '';
    parts.push(`${langName(market.lang)}: ${formatNumber(market.review_count)} reviews${ratingStr}.`);
  }

  return parts.join(' ');
}


// ---------------------------------------------------------------------------
// NEW: AI Discovery narrative
// ---------------------------------------------------------------------------

/**
 * "How invisible this hotel is to AI and what that costs."
 */
export function getAIDiscoveryNarrative(hotel: HotelDashboardRow, competitorAverage: number | null): string {
  const score = hotel.ai_visibility_score;

  if (score == null && hotel.ai_chatgpt_mentioned == null) {
    return 'AI discovery benchmarks have not been collected yet. When travelers ask ChatGPT or Perplexity for hotel recommendations in this city, we don\'t yet know if this property appears.';
  }

  if (typeof score === 'number') {
    if (score < 0.2) {
      return `This hotel is nearly invisible to AI search — appearing in only ${Math.round(score * 100)}% of benchmark queries. Competitors average ${competitorAverage != null ? Math.round(competitorAverage * 100) + '%' : 'unknown'}. As AI-referred bookings grow, this gap becomes a direct revenue leak.`;
    }
    if (score < 0.5) {
      return `AI visibility is below average at ${Math.round(score * 100)}%. The hotel appears in some queries but is not consistently recommended.`;
    }
    return `AI visibility is solid at ${Math.round(score * 100)}% — the hotel appears in most relevant benchmark queries.`;
  }

  if (hotel.ai_chatgpt_mentioned === false && hotel.ai_perplexity_mentioned === false) {
    return 'Neither ChatGPT nor Perplexity currently surfaces this hotel. As AI-powered travel planning grows, missing from these results means missing bookings.';
  }

  return 'AI discovery data has not been collected yet for this property.';
}


// ---------------------------------------------------------------------------
// NEW: Content readiness narrative
// ---------------------------------------------------------------------------

/**
 * "What marketing assets could be generated RIGHT NOW from the data."
 */
export function getContentReadiness(
  hotel: HotelDashboardRow,
  seeds: ContentSeedRow[],
  languages: LanguageBreakdownRow[],
  topics: HotelTopicRow[],
): string {
  const parts: string[] = [];

  // Quality-filtered seeds
  const qualitySeeds = seeds.filter(s =>
    s.quote && s.quote.length >= 25 &&
    !(s.quote === s.quote.toUpperCase() && s.quote.length > 5)
  );

  if (qualitySeeds.length > 0) {
    parts.push(`${qualitySeeds.length} marketing-ready guest quotes are available for campaigns.`);

    // Breakdown by use
    const uses = new Map<string, number>();
    for (const s of qualitySeeds) {
      if (s.marketing_use) uses.set(s.marketing_use, (uses.get(s.marketing_use) ?? 0) + 1);
    }
    const useStr = [...uses.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([use, count]) => `${count} ${use}`)
      .join(', ');
    if (useStr) parts.push(`Breakdown: ${useStr}.`);
  } else {
    parts.push('No marketing-ready guest quotes extracted yet.');
  }

  // Language content opportunity
  const websiteLanguages = getEffectiveWebsiteLanguages(hotel.dp_website_content_languages);
  const unserved = getUnservedLanguageMarkets(languages, websiteLanguages);
  if (unserved.length > 0) {
    parts.push(`${unserved.length} language-specific landing pages could be generated from existing review intelligence.`);
  }

  // Topic-based content
  const strongTopics = topics.filter(t => t.mention_count >= 20 && (t.positive_pct ?? 0) >= 80);
  if (strongTopics.length > 0) {
    const topicNames = strongTopics.slice(0, 3).map(t => titleCase(t.aspect).toLowerCase());
    parts.push(`Strong content angles: ${topicNames.join(', ')}.`);
  }

  return parts.join(' ');
}


// ---------------------------------------------------------------------------
// NEW: Review momentum narrative
// ---------------------------------------------------------------------------

/**
 * "Is this hotel's reputation improving or declining?"
 */
export function getReviewMomentum(
  hotel: HotelDashboardRow,
  timeline: ReviewTimelineRow[],
): string {
  if (timeline.length < 3) {
    return 'Not enough review history to determine a trend.';
  }

  const recent = timeline.slice(-3);
  const prior = timeline.slice(-6, -3);

  if (prior.length === 0) {
    const recentTotal = recent.reduce((sum, t) => sum + t.review_count, 0);
    return `${formatNumber(recentTotal)} reviews in the last 3 months tracked.`;
  }

  const recentVolume = recent.reduce((sum, t) => sum + t.review_count, 0);
  const priorVolume = prior.reduce((sum, t) => sum + t.review_count, 0);
  const recentAvg = recent.reduce((sum, t) => sum + (t.avg_rating ?? 0) * t.review_count, 0) /
    Math.max(recent.reduce((sum, t) => sum + t.review_count, 0), 1);
  const priorAvg = prior.reduce((sum, t) => sum + (t.avg_rating ?? 0) * t.review_count, 0) /
    Math.max(prior.reduce((sum, t) => sum + t.review_count, 0), 1);

  const parts: string[] = [];

  // Volume trend
  if (priorVolume > 0) {
    const volumeChange = ((recentVolume - priorVolume) / priorVolume * 100);
    if (Math.abs(volumeChange) > 10) {
      parts.push(`Review volume ${volumeChange > 0 ? 'up' : 'down'} ${Math.abs(Math.round(volumeChange))}% vs prior quarter.`);
    } else {
      parts.push('Review volume is stable vs prior quarter.');
    }
  }

  // Rating trend
  if (priorAvg > 0 && recentAvg > 0) {
    const ratingDelta = recentAvg - priorAvg;
    if (Math.abs(ratingDelta) > 0.1) {
      parts.push(`Average rating ${ratingDelta > 0 ? 'improved' : 'declined'} from ${formatDecimal(priorAvg, 1)} to ${formatDecimal(recentAvg, 1)}.`);
    }
  }

  // Negative sentiment trend
  const recentNeg = recent.reduce((sum, t) => sum + t.negative, 0);
  const priorNeg = prior.reduce((sum, t) => sum + t.negative, 0);
  if (recentNeg > priorNeg * 1.5 && priorNeg > 5) {
    parts.push(`Negative reviews increased significantly — worth investigating.`);
  }

  return parts.join(' ') || `${formatNumber(recentVolume)} reviews in the last 3 months, steady trajectory.`;
}


// ---------------------------------------------------------------------------
// NEW: Portfolio-level insight generators
// ---------------------------------------------------------------------------

export interface ChainSummary {
  headline: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
}

/**
 * "Across N properties: strengths, weaknesses, patterns."
 */
export function getChainSummary(
  hotels: HotelDashboardRow[],
  summaryRow?: ChainIntelligenceRow | null,
): ChainSummary {
  const rated = hotels.filter(h => h.ta_rating != null);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const patterns: string[] = [];

  if (rated.length === 0) {
    return { headline: `${hotels.length} properties in the portfolio.`, strengths: [], weaknesses: [], patterns: [] };
  }

  const avgRating = summaryRow?.avg_rating ?? (rated.reduce((sum, h) => sum + h.ta_rating!, 0) / rated.length);
  const totalReviews = summaryRow?.total_reviews_db ?? hotels.reduce((sum, h) => sum + h.total_reviews_db, 0);
  const avgOpportunity = summaryRow?.avg_opportunity_score ?? (
    hotels
      .map(h => h.computed_opportunity_score ?? h.score_tos)
      .filter((value): value is number => typeof value === 'number')
      .reduce((sum, value, _, rows) => sum + value / Math.max(rows.length, 1), 0)
  );
  const avgLanguageGap = summaryRow?.avg_language_gap ?? (
    hotels
      .map(h => h.computed_language_gap)
      .filter((value): value is number => typeof value === 'number')
      .reduce((sum, value, _, rows) => sum + value / Math.max(rows.length, 1), 0)
  );
  const countries = new Set(hotels.map(h => h.country).filter(Boolean));
  const headline = `${hotels.length} properties across ${countries.size} countries, ${formatNumber(totalReviews)} reviews, average rating ${formatDecimal(avgRating, 1)}, and an average opportunity score of ${Math.round((avgOpportunity ?? 0) * 100)}/100.`;

  const topRated = rated.filter(h => h.ta_rating! >= 4.8);
  if (topRated.length > 0) {
    strengths.push(`${topRated.length} properties rated 4.8+.`);
  }

  const highResponse = hotels.filter(h => h.ta_owner_response_rate != null && h.ta_owner_response_rate > 0.8);
  if (highResponse.length > rated.length * 0.6) {
    strengths.push(`${highResponse.length} of ${rated.length} rated properties respond to 80%+ of reviews — reputation operations are mostly strong.`);
  }

  const directCheaper = hotels.filter(h =>
    typeof h.price_direct === 'number' &&
    typeof h.price_lowest_ota === 'number' &&
    h.price_direct < h.price_lowest_ota,
  );
  if (directCheaper.length > 0) {
    strengths.push(`${directCheaper.length} properties already beat OTAs on direct pricing, which gives sales a concrete direct-booking story.`);
  }

  const valueWeak = hotels.filter(h => h.ta_subrating_weakest === 'value');
  if (valueWeak.length > rated.length * 0.5) {
    weaknesses.push(`Value is the weakest subrating at ${valueWeak.length} of ${rated.length} rated properties — a chain-wide pricing-perception issue.`);
  }

  if ((avgLanguageGap ?? 0) >= 3) {
    weaknesses.push(`Guests review in roughly ${formatDecimal(avgLanguageGap, 1)} more languages than hotel websites serve on average — localization is the biggest chain-wide wedge.`);
  }

  const evidenceThin = hotels.filter(h => (h.total_reviews_db ?? 0) === 0);
  if (evidenceThin.length > 0) {
    weaknesses.push(`${evidenceThin.length} properties still have no review evidence in the live app, so they are not yet showcase-grade briefs.`);
  }

  const missingContact = hotels.filter(h => !h.cx_gm_name && !h.cx_gm_email && !h.cx_gm_phone);
  if (missingContact.length > hotels.length * 0.5) {
    weaknesses.push(`Contact intelligence is still missing on ${missingContact.length} properties, which caps outbound readiness even when the guest proof is strong.`);
  }

  const segmentCounts = { Family: 0, Couples: 0, Business: 0 };
  hotels.forEach(h => {
    if (h.ta_primary_segment === 'family') segmentCounts.Family++;
    if (h.ta_primary_segment === 'couples') segmentCounts.Couples++;
    if (h.ta_primary_segment === 'business') segmentCounts.Business++;
  });
  const topSegment = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1])[0];
  if (topSegment[1] > 0) {
    patterns.push(`${topSegment[0]} is the dominant primary segment at ${topSegment[1]} properties, so outreach and content should assume a broad luxury-leisure bias first.`);
  }

  if (summaryRow?.hotels_with_ai_visibility === 0) {
    patterns.push('AI visibility is not yet populated anywhere in this chain, so it is a portfolio product gap, not a hotel-ranking signal.');
  }

  const zeroSocial = hotels.filter(h => h.dp_has_active_social === true).length === 0;
  if (zeroSocial) {
    patterns.push('Structured digital signals are much sparser than review signals, so the moat currently comes from guest evidence more than from website instrumentation.');
  }

  if ((summaryRow?.avg_processed_review_coverage ?? 0) > 0) {
    patterns.push(`Average processed-review coverage is ${Math.round((summaryRow?.avg_processed_review_coverage ?? 0) * 100)}%, which is enough to support proof-heavy briefings on the strongest properties.`);
  }

  return { headline, strengths, weaknesses, patterns };
}


/**
 * "The N hotels that need Lumina most, ranked with reasons."
 */
export function getTopOpportunities(
  hotels: HotelDashboardRow[],
  n: number = 10,
): Array<{ hotel: HotelDashboardRow; reason: string }> {
  type Scored = { hotel: HotelDashboardRow; score: number; reason: string };
  const scored: Scored[] = [];

  for (const hotel of hotels) {
  const computed = hotel.computed_opportunity_score;
  const computedReason = hotel.computed_opportunity_narrative;

    if (typeof computed === 'number' && shouldUseComputedOpportunityNarrative(hotel, computedReason)) {
      scored.push({ hotel, score: computed, reason: computedReason! });
      continue;
    }

    let score = 0;
    let reason = '';

    const effectiveLangs = getEffectiveWebsiteLanguageCount(hotel);
    const reviewLangs = hotel.ta_review_language_count ?? 0;
    const langGap = Math.max(reviewLangs - effectiveLangs, 0);
    if (effectiveLangs > 0 && langGap > 3) {
      score += Math.min(langGap / 12, 0.45);
      reason = `Guests review in ${reviewLangs} languages while the website serves ${effectiveLangs}.`;
    } else if (effectiveLangs > 0 && langGap > 0) {
      score += langGap * 0.03;
    }

    if (hotel.ta_subrating_service != null && hotel.ta_subrating_value != null) {
      const vg = hotel.ta_subrating_service - hotel.ta_subrating_value;
      if (vg > 0.3) {
        score += vg * 0.25;
        if (!reason) reason = `Guests rate value ${formatDecimal(vg, 1)} points below service.`;
      }
    }

    if (hotel.ta_owner_response_rate != null && hotel.ta_owner_response_rate < 0.3) {
      score += 0.08;
      if (!reason) reason = `Only ${Math.round(hotel.ta_owner_response_rate * 100)}% of reviews get a response.`;
    }

    if (hotel.ta_rating != null && hotel.ta_compset_avg_rating != null) {
      const cd = hotel.ta_compset_avg_rating - hotel.ta_rating;
      if (cd > 0.1) {
        score += cd * 0.18;
        if (!reason) reason = `${formatDecimal(cd, 1)} points below the mapped competitive set.`;
      }
    }

    if (
      typeof hotel.price_direct === 'number' &&
      typeof hotel.price_lowest_ota === 'number' &&
      hotel.price_direct < hotel.price_lowest_ota
    ) {
      score += 0.06;
      if (!reason) reason = `Direct already undercuts OTAs by ${formatNumber(Math.round(Math.abs(hotel.price_direct - hotel.price_lowest_ota)))}.`;
    }

    if ((hotel.total_reviews_db ?? 0) === 0) {
      score = Math.max(score - 0.2, 0);
      if (!reason) reason = 'Review evidence is still thin; complete the corpus before using it as a showcase brief.';
    }

    if (!reason) reason = `${formatNumber(hotel.total_reviews_db)} reviews already mapped for proof-led outreach.`;

    scored.push({ hotel, score, reason });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ hotel, reason }) => ({ hotel, reason }));
}


/**
 * "Kempinski's position in [market] vs competitors."
 */
export function getMarketInsight(
  hotels: HotelDashboardRow[],
  country: string,
): string {
  const countryHotels = hotels.filter(h =>
    h.country?.toLowerCase() === country.toLowerCase()
  );

  if (countryHotels.length === 0) {
    return `No properties found in ${country}.`;
  }

  const parts: string[] = [];
  const rated = countryHotels.filter(h => h.ta_rating != null);
  const avgLanguageGap = countryHotels
    .map(h => h.computed_language_gap)
    .filter((value): value is number => typeof value === 'number');
  const directCheaper = countryHotels.filter(h =>
    typeof h.price_direct === 'number' &&
    typeof h.price_lowest_ota === 'number' &&
    h.price_direct < h.price_lowest_ota,
  );

  parts.push(`${countryHotels.length} propert${countryHotels.length === 1 ? 'y' : 'ies'} in ${country}.`);

  if (rated.length > 0) {
    const avgRating = rated.reduce((sum, h) => sum + h.ta_rating!, 0) / rated.length;
    parts.push(`Average rating ${formatDecimal(avgRating, 1)}.`);

    const best = rated.sort((a, b) => b.ta_rating! - a.ta_rating!)[0];
    if (rated.length > 1) {
      parts.push(`Top performer: ${best.name} at ${formatDecimal(best.ta_rating, 1)}.`);
    }
  }

  const totalReviews = countryHotels.reduce((sum, h) => sum + h.total_reviews_db, 0);
  parts.push(`${formatNumber(totalReviews)} total reviews in this market.`);

  if (avgLanguageGap.length) {
    const avg = avgLanguageGap.reduce((sum, value) => sum + value, 0) / avgLanguageGap.length;
    if (avg >= 3) {
      parts.push(`Average language gap is ${formatDecimal(avg, 1)}, so localization is the clearest commercial wedge here.`);
    }
  }

  if (directCheaper.length > 0) {
    parts.push(`${directCheaper.length} properties already beat OTAs on direct rate, which makes direct-booking messaging more credible here.`);
  }

  return parts.join(' ');
}
