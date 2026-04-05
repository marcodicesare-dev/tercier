import type {
  ContentSeedExtraction,
  CompetitorMentionExtraction,
  GuestPersonaExtraction,
  ReviewNlpExtraction,
  ReviewTopicExtraction,
} from '../../enrich-hotel/types.js';

const ALLOWED_SENTIMENTS = new Set(['positive', 'negative', 'neutral', 'mixed']);
const ALLOWED_ASPECTS = new Set([
  'room_cleanliness',
  'bed_quality',
  'bathroom',
  'noise',
  'view',
  'design_decor',
  'staff_service',
  'checkin_checkout',
  'breakfast',
  'restaurant',
  'bar',
  'food_quality',
  'wifi',
  'spa',
  'pool',
  'parking',
  'security',
  'value_for_money',
  'location_convenience',
]);

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeAspectRows(value: unknown): ReviewTopicExtraction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const aspect = asString(row.aspect);
      const sentiment = asString(row.sentiment);
      const score = asNumber(row.score);
      const mention = asString(row.mention);
      if (!aspect || !ALLOWED_ASPECTS.has(aspect)) return null;
      if (!sentiment || !ALLOWED_SENTIMENTS.has(sentiment)) return null;
      return {
        aspect,
        sentiment,
        score: Math.max(-1, Math.min(1, score ?? 0)),
        mention: mention ?? '',
      };
    })
    .filter((row): row is ReviewTopicExtraction => Boolean(row));
}

function normalizeGuestPersona(value: unknown): GuestPersonaExtraction | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  return {
    occasion: asString(row.occasion),
    length_of_stay: asString(row.length_of_stay),
    spending_level: asString(row.spending_level),
    is_repeat_guest: typeof row.is_repeat_guest === 'boolean' ? row.is_repeat_guest : null,
    repeat_visit_count: asNumber(row.repeat_visit_count),
    group_detail: asString(row.group_detail),
  };
}

function normalizeCompetitorMentions(value: unknown): CompetitorMentionExtraction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = asString(row.name);
      const comparison = asString(row.comparison);
      const quote = asString(row.quote);
      if (!name || !comparison || !quote) return null;
      return { name, comparison, quote };
    })
    .filter((row): row is CompetitorMentionExtraction => Boolean(row));
}

function normalizeContentSeeds(value: unknown): ContentSeedExtraction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const quote = asString(row.quote);
      const emotion = asString(row.emotion);
      const segment = asString(row.segment);
      const use = asString(row.use);
      if (!quote || !emotion || !segment || !use) return null;
      return { quote, emotion, segment, use };
    })
    .filter((row): row is ContentSeedExtraction => Boolean(row));
}

export function normalizeReviewNlpExtraction(value: unknown): ReviewNlpExtraction | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const overallSentiment = asString(row.overall_sentiment);
  if (!overallSentiment || !ALLOWED_SENTIMENTS.has(overallSentiment)) return null;

  return {
    overall_sentiment: overallSentiment as ReviewNlpExtraction['overall_sentiment'],
    overall_sentiment_score: Math.max(-1, Math.min(1, asNumber(row.overall_sentiment_score) ?? 0)),
    aspects: normalizeAspectRows(row.aspects),
    guest_persona: normalizeGuestPersona(row.guest_persona),
    competitor_mentions: normalizeCompetitorMentions(row.competitor_mentions),
    content_seeds: normalizeContentSeeds(row.content_seeds),
  };
}

export function inferGuestSegment(
  persona: GuestPersonaExtraction | null,
  tripType: string | null | undefined,
): string | null {
  const normalizedTripType = asString(tripType)?.toLowerCase() ?? null;
  if (normalizedTripType) {
    if (normalizedTripType.includes('business')) return 'business';
    if (normalizedTripType.includes('family')) return 'families';
    if (normalizedTripType.includes('couple')) return 'couples';
    if (normalizedTripType.includes('friend')) return 'friends';
    if (normalizedTripType.includes('solo')) return 'solo';
  }

  const detail = persona?.group_detail?.toLowerCase() ?? '';
  if (detail.includes('couple')) return 'couples';
  if (detail.includes('family') || detail.includes('kids') || detail.includes('parents')) return 'families';
  if (detail.includes('friend') || detail.includes('group')) return 'friends';
  if (detail.includes('solo')) return 'solo';

  const occasion = persona?.occasion?.toLowerCase() ?? '';
  if (occasion.includes('business')) return 'business';
  if (occasion.includes('family')) return 'families';
  if (occasion.includes('anniversary') || occasion.includes('honeymoon') || occasion.includes('getaway')) return 'couples';

  return null;
}

export function chunk<T>(values: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}
