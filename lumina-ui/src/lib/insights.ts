import type {
  CompetitorNetworkRow,
  ContentSeedRow,
  GuestPersonaDeepDiveData,
  GuestPersonaRow,
  HotelAmenityRow,
  HotelDashboardRow,
  HotelPriceSnapshotRow,
  HotelTopicRow,
  LanguageBreakdownRow,
} from '@/lib/types';
import { formatDecimal, formatNumber, titleCase } from '@/lib/utils';

const AI_QUERY_BENCHMARK = 20;

function roundScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function positiveDelta(current: number | null | undefined, comparison: number | null | undefined): number | null {
  if (current == null || comparison == null) return null;
  return current - comparison;
}

function parseWebsiteLanguages(raw: string | null | undefined): string[] {
  return (raw ?? '')
    .split(/[,|/]/)
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function getWebsiteLanguageCount(hotel: HotelDashboardRow): number {
  if (hotel.dp_website_language_count && hotel.dp_website_language_count > 0) return hotel.dp_website_language_count;
  return parseWebsiteLanguages(hotel.dp_website_content_languages).length;
}

function getTopLanguageGap(
  languages: LanguageBreakdownRow[],
  websiteLanguages: string[],
): LanguageBreakdownRow | null {
  const supported = new Set(websiteLanguages);
  return [...languages]
    .filter(language => {
      const code = language.lang.trim().toLowerCase();
      return !supported.has(code) && ![...supported].some(item => item.startsWith(code) || code.startsWith(item));
    })
    .sort((left, right) => right.review_count - left.review_count)[0] ?? null;
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
    .filter(topic => topic.mention_count > 0)
    .map(topic => ({
      ...topic,
      positiveRate: topic.positive_pct ?? (topic.positive_count / Math.max(topic.mention_count, 1)),
      negativeRate: topic.negative_pct ?? (topic.negative_count / Math.max(topic.mention_count, 1)),
    }));

  const strongestPraise = [...ranked].sort((left, right) => right.positiveRate - left.positiveRate)[0] ?? null;
  const biggestConcern = [...ranked].sort((left, right) => right.negativeRate - left.negativeRate)[0] ?? null;

  return { strongestPraise, biggestConcern };
}

export function getCardOpportunityInsight(hotel: HotelDashboardRow): string {
  if (typeof hotel.ai_visibility_score === 'number' && hotel.ai_visibility_score < 0.3) {
    const visible = Math.round(hotel.ai_visibility_score * AI_QUERY_BENCHMARK);
    const invisible = Math.max(0, AI_QUERY_BENCHMARK - visible);
    return `Invisible to ChatGPT on ${invisible}/${AI_QUERY_BENCHMARK} discovery queries.`;
  }

  const websiteLanguageCount = getWebsiteLanguageCount(hotel);
  if ((hotel.ta_review_language_count ?? 0) > Math.max(websiteLanguageCount, 0) * 2 && websiteLanguageCount > 0) {
    return `Guests review in ${formatNumber(hotel.ta_review_language_count)} languages, website serves ${formatNumber(websiteLanguageCount)}.`;
  }

  if (
    hotel.ta_subrating_weakest === 'value' &&
    typeof hotel.ta_subrating_service === 'number' &&
    typeof hotel.ta_subrating_value === 'number' &&
    (hotel.ta_subrating_range ?? 0) > 0.5
  ) {
    const gap = hotel.ta_subrating_service - hotel.ta_subrating_value;
    return `Guests rate value ${formatDecimal(gap, 1)} points below service.`;
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
    ? `Overall quality lands at ${quality}/100, with guest sentiment concentrated in a narrow band across the stay.`
    : 'Guest quality signal is available, but the biggest gap is not yet clear.';
}

export function getWhoStaysInsight(
  hotel: HotelDashboardRow,
  personas: GuestPersonaRow[],
  deepDive: GuestPersonaDeepDiveData,
): string {
  const topPersona = personas[0] ?? null;
  const primarySegment = hotel.ta_primary_segment ? titleCase(hotel.ta_primary_segment) : null;

  if (topPersona) {
    const parts = [
      topPersona.occasion ? titleCase(topPersona.occasion) : null,
      topPersona.group_detail ? titleCase(topPersona.group_detail) : null,
      topPersona.spending_level ? titleCase(topPersona.spending_level) : null,
    ].filter(Boolean);
    return `${parts.join(' · ')} is the dominant persona, backed by ${formatNumber(topPersona.review_count)} reviews and an average rating of ${formatDecimal(topPersona.avg_rating, 1)}.`;
  }

  if (primarySegment && deepDive.repeatGuestPct != null) {
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
    return `This hotel sits ${formatDecimal(Math.abs(delta), 1)} points ${direction} the competitive-set average on TripAdvisor.${strength}`;
  }

  return `${formatNumber(competitors.length)} nearby competitors are mapped, giving sales and strategy a concrete set to compare against.`;
}

export function getTopicInsight(topics: HotelTopicRow[]): string {
  const { strongestPraise, biggestConcern } = getBestAndWorstTopic(topics);

  if (strongestPraise && biggestConcern) {
    return `Strongest praise goes to ${titleCase(strongestPraise.aspect)}; the main drag is ${titleCase(biggestConcern.aspect)}.`;
  }

  if (strongestPraise) {
    return `${titleCase(strongestPraise.aspect)} drives the clearest positive signal in the review corpus.`;
  }

  return 'Topic coverage exists, but no single aspect clearly leads or drags sentiment yet.';
}

export function getLanguageInsight(
  hotel: HotelDashboardRow,
  languages: LanguageBreakdownRow[],
): string {
  const websiteLanguages = parseWebsiteLanguages(hotel.dp_website_content_languages);
  const websiteLanguageCount = getWebsiteLanguageCount(hotel);
  const gap = getTopLanguageGap(languages, websiteLanguages);

  if (gap && websiteLanguageCount > 0) {
    return `Guests review in ${formatNumber(hotel.ta_review_language_count)} languages, while the site serves ${formatNumber(websiteLanguageCount)}. The biggest missed market is ${titleCase(gap.lang)} with ${formatNumber(gap.review_count)} reviews.`;
  }

  if (gap) {
    return `${titleCase(gap.lang)} is the clearest uncovered language in the review mix with ${formatNumber(gap.review_count)} reviews.`;
  }

  return `Language demand is spread across ${formatNumber(hotel.ta_review_language_count)} review languages.`;
}

export function getAiVisibilityInsight(hotel: HotelDashboardRow, competitorAverage: number | null): string {
  const score = hotel.ai_visibility_score;
  const delta = positiveDelta(score, competitorAverage);

  if (typeof score === 'number' && score < 0.3) {
    const visible = Math.round(score * AI_QUERY_BENCHMARK);
    const invisible = Math.max(0, AI_QUERY_BENCHMARK - visible);
    return `This hotel is effectively missing from AI discovery, invisible on ${invisible}/${AI_QUERY_BENCHMARK} benchmark queries.`;
  }

  if (delta != null && delta < 0) {
    return `AI visibility trails the mapped competitive set by ${formatDecimal(Math.abs(delta), 2)} points.`;
  }

  if (hotel.ai_chatgpt_mentioned === false && hotel.ai_perplexity_mentioned === false) {
    return 'Neither ChatGPT nor Perplexity currently surfaces this hotel in cached discovery checks.';
  }

  return 'AI discovery signal exists, but the property is not yet converting that signal into a clear competitive edge.';
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
        ? `Direct is currently priced above the cheapest OTA by ${Math.round(delta)}.`
        : `Direct undercuts the cheapest OTA by ${Math.round(Math.abs(delta))}, a strong conversion lever.`;
    }
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
  const websiteLanguageCount = getWebsiteLanguageCount(hotel);
  const amenitiesCount = amenities.length || hotel.ta_amenity_count || 0;

  if (
    (hotel.ta_review_language_count ?? 0) > Math.max(websiteLanguageCount, 0) * 2 &&
    websiteLanguageCount > 0
  ) {
    return `The digital stack is underserving demand: ${formatNumber(hotel.ta_review_language_count)} guest languages vs ${formatNumber(websiteLanguageCount)} website languages.`;
  }

  if (hotel.gmb_is_claimed === false) {
    return 'The Google Business profile is still unclaimed, leaving an avoidable discovery and response gap.';
  }

  if (hotel.dp_has_schema_hotel === false || (hotel.dp_schema_completeness ?? 1) < 0.65) {
    return `Structured data coverage is thin at ${Math.round((hotel.dp_schema_completeness ?? 0) * 100)}%, which weakens search and AI understanding.`;
  }

  if ((hotel.cx_active_job_count ?? 0) > 0) {
    return `${formatNumber(hotel.cx_active_job_count)} open roles suggest the property is actively growing or stretched operationally.`;
  }

  return `${formatNumber(amenitiesCount)} amenities, ${titleCase(hotel.dp_website_tech_cms)} CMS, and ${formatNumber(hotel.seo_domain_authority)} domain authority form the core operating footprint.`;
}

export function getContentSeedInsight(seeds: ContentSeedRow[]): string {
  const seed = seeds[0];
  if (!seed) return 'Guest-quote seeds are available for sales and marketing reuse.';
  const emotion = seed.emotion ? `${titleCase(seed.emotion)} tone` : 'review-led';
  return `The quote library already has ${emotion} material ready for campaigns, outreach, and landing-page copy.`;
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
