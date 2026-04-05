import OpenAI, { toFile } from 'openai';
import { loadEnvFiles } from '../../enrich-hotel/utils.js';

loadEnvFiles();

export interface ReviewForNlp {
  id: string;
  hotel_id: string;
  source: string;
  source_review_id: string | null;
  text: string;
  rating: number | null;
  lang: string;
  trip_type: string | null;
  published_date: string | null;
}

export interface NlpBatchMetadata {
  batchId: string;
  inputFileId: string;
  createdAt: string;
  reviewIds: string[];
  reviewCount: number;
  status: string;
  outputFileId?: string | null;
  errorFileId?: string | null;
  completedAt?: string | null;
}

export const REVIEW_NLP_SYSTEM_PROMPT = `You are a hotel review intelligence extractor. Analyze the review and return structured JSON.

Analyze in the source language. Return aspect names in English. Return mention_text quotes in the original language.
Keep the output concise and valid JSON. Never wrap the JSON in markdown fences.
Return at most 6 aspects, at most 2 competitor_mentions, and at most 2 content_seeds.
Only use aspects from the taxonomy below. If an item is not present, return an empty array or null values.

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

export function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey });
}

export function buildReviewUserPrompt(review: Pick<ReviewForNlp, 'text' | 'rating' | 'lang' | 'trip_type'>): string {
  return `Review (${review.lang}, rating: ${review.rating ?? 'unknown'}/5${review.trip_type ? `, trip type: ${review.trip_type}` : ''}):\n\n${review.text}`;
}

export async function extractReviewNlpDirect(client: OpenAI, review: ReviewForNlp): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      { role: 'system', content: REVIEW_NLP_SYSTEM_PROMPT },
      { role: 'user', content: buildReviewUserPrompt(review) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 1200,
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function createReviewNlpBatch(client: OpenAI, reviews: ReviewForNlp[]): Promise<NlpBatchMetadata> {
  const lines = reviews.map(review => JSON.stringify({
    custom_id: review.id,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: REVIEW_NLP_SYSTEM_PROMPT },
        { role: 'user', content: buildReviewUserPrompt(review) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 1200,
    },
  })).join('\n');

  const inputFile = await client.files.create({
    file: await toFile(Buffer.from(lines, 'utf8'), `hotel-review-nlp-${Date.now()}.jsonl`, { type: 'application/jsonl' }),
    purpose: 'batch',
  });

  const batch = await client.batches.create({
    input_file_id: inputFile.id,
    endpoint: '/v1/chat/completions',
    completion_window: '24h',
  });

  return {
    batchId: batch.id,
    inputFileId: inputFile.id,
    createdAt: new Date().toISOString(),
    reviewIds: reviews.map(review => review.id),
    reviewCount: reviews.length,
    status: batch.status,
    outputFileId: batch.output_file_id ?? null,
    errorFileId: batch.error_file_id ?? null,
    completedAt: batch.completed_at ? new Date(batch.completed_at * 1000).toISOString() : null,
  };
}

export async function getBatchOutputText(client: OpenAI, fileId: string): Promise<string> {
  const response = await client.files.content(fileId);
  return await response.text();
}
