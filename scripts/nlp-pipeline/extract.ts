#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type OpenAI from 'openai';
import { loadEnvFiles } from '../enrich-hotel/utils.js';
import { chunk, inferGuestSegment, normalizeReviewNlpExtraction } from './lib/aggregator.js';
import { generateEmbeddings } from './lib/embedding-client.js';
import {
  createReviewNlpBatch,
  extractReviewNlpDirect,
  getBatchOutputText,
  getOpenAiClient,
  type NlpBatchMetadata,
  type ReviewForNlp,
} from './lib/openai-client.js';
import type { ReviewNlpExtraction } from '../enrich-hotel/types.js';
import { refreshDashboardViews, supabase } from '../phase0-enrichment/lib/supabase.js';

loadEnvFiles();

const BATCH_DIR = resolve(process.cwd(), 'scripts/nlp-pipeline/cache/nlp-batches');
const POLL_INTERVAL_MS = 30000;
const WAIT_TIMEOUT_MS = 2 * 60 * 60 * 1000;

interface PersistedBatchMetadata extends NlpBatchMetadata {
  reviews: ReviewForNlp[];
}

interface CliOptions {
  batchId?: string;
  limit: number;
  wait: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const limitIndex = args.indexOf('--limit');
  const batchIdIndex = args.indexOf('--batch-id');
  return {
    batchId: batchIdIndex !== -1 ? args[batchIdIndex + 1] : undefined,
    limit: limitIndex !== -1 ? Number.parseInt(args[limitIndex + 1] ?? '1000', 10) || 1000 : 1000,
    wait: args.includes('--wait'),
  };
}

function metadataPath(batchId: string): string {
  return resolve(BATCH_DIR, `${batchId}.json`);
}

function outputCachePath(batchId: string): string {
  return resolve(BATCH_DIR, `${batchId}.output.jsonl`);
}

function loadMetadata(batchId: string): PersistedBatchMetadata {
  return JSON.parse(readFileSync(metadataPath(batchId), 'utf8')) as PersistedBatchMetadata;
}

function saveMetadata(metadata: PersistedBatchMetadata): void {
  mkdirSync(BATCH_DIR, { recursive: true });
  writeFileSync(metadataPath(metadata.batchId), `${JSON.stringify(metadata, null, 2)}\n`);
}

function extractMessageContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, any>;
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const joined = content
      .map(item => (item && typeof item === 'object' && typeof item.text === 'string' ? item.text : null))
      .filter((value): value is string => Boolean(value))
      .join('');
    return joined || null;
  }
  return null;
}

function extractLikelyJson(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function parseExtractionContent(content: string): ReviewNlpExtraction | null {
  const candidates = [content, extractLikelyJson(content)];
  for (const candidate of candidates) {
    if (!candidate.trim()) continue;
    try {
      const parsed = JSON.parse(candidate);
      const normalized = normalizeReviewNlpExtraction(parsed);
      if (normalized) return normalized;
    } catch {
      continue;
    }
  }
  return null;
}

function toHalfvecLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

async function fetchUnprocessedReviews(limit: number): Promise<ReviewForNlp[]> {
  const output: ReviewForNlp[] = [];
  const pageSize = Math.min(limit, 1000);

  for (let offset = 0; offset < limit; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, limit - 1);
    const { data, error } = await supabase
      .from('hotel_reviews')
      .select('id,hotel_id,source,source_review_id,text,rating,lang,trip_type,published_date')
      .is('nlp_processed_at', null)
      .not('text', 'is', null)
      .order('published_date', { ascending: false })
      .range(offset, end);

    if (error) throw error;

    const normalized = (data ?? [])
      .filter(row => typeof row.text === 'string' && row.text.trim().length > 0)
      .map(row => ({
        id: String(row.id),
        hotel_id: String(row.hotel_id),
        source: String(row.source),
        source_review_id: row.source_review_id ? String(row.source_review_id) : null,
        text: String(row.text),
        rating: typeof row.rating === 'number' ? row.rating : null,
        lang: String(row.lang),
        trip_type: typeof row.trip_type === 'string' ? row.trip_type : null,
        published_date: row.published_date ? String(row.published_date) : null,
      }));

    output.push(...normalized);
    if (normalized.length < pageSize) break;
  }

  return output;
}

async function upsertReviewNlpRows(rows: Array<Record<string, unknown>>): Promise<void> {
  for (const batch of chunk(rows, 200)) {
    const { error } = await supabase.from('hotel_reviews').upsert(batch, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });
    if (error) throw error;
  }
}

async function replaceReviewTopicRows(reviewIds: string[], topicRows: Array<Record<string, unknown>>): Promise<void> {
  for (const reviewIdBatch of chunk(reviewIds, 200)) {
    const { error } = await supabase.from('review_topic_index').delete().in('review_id', reviewIdBatch);
    if (error) throw error;
  }

  for (const topicBatch of chunk(topicRows, 500)) {
    const { error } = await supabase.from('review_topic_index').upsert(topicBatch, {
      onConflict: 'review_id,aspect',
      ignoreDuplicates: false,
    });
    if (error) throw error;
  }
}

function dedupeTopicRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const seen = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = `${String(row.review_id)}:${String(row.aspect)}`;
    seen.set(key, row);
  }
  return [...seen.values()];
}

async function rescueFailedBatchRows(
  client: OpenAI,
  reviews: ReviewForNlp[],
): Promise<Array<{ review: ReviewForNlp; extraction: ReviewNlpExtraction }>> {
  const rescued: Array<{ review: ReviewForNlp; extraction: ReviewNlpExtraction }> = [];

  for (const reviewBatch of chunk(reviews, 10)) {
    const settled = await Promise.allSettled(reviewBatch.map(async review => {
      const content = await extractReviewNlpDirect(client, review);
      const extraction = parseExtractionContent(content);
      return extraction ? { review, extraction } : null;
    }));

    for (const result of settled) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      rescued.push(result.value);
    }
  }

  return rescued;
}

async function applyCompletedBatch(
  client: OpenAI,
  metadata: PersistedBatchMetadata,
  outputFileId: string,
): Promise<{ updatedReviews: number; topicRows: number; embeddedReviews: number }> {
  const outputText = await getBatchOutputText(client, outputFileId);
  writeFileSync(outputCachePath(metadata.batchId), outputText);

  const reviewById = new Map(metadata.reviews.map(review => [review.id, review]));
  const parsedUpdates: Array<{ review: ReviewForNlp; extraction: ReviewNlpExtraction }> = [];
  const failedReviewIds = new Set<string>();

  for (const line of outputText.split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Record<string, any>;
    const reviewId = typeof row.custom_id === 'string' ? row.custom_id : null;
    if (!reviewId) continue;
    const review = reviewById.get(reviewId);
    if (!review) continue;
    if (row.response?.status_code !== 200) continue;

    const content = extractMessageContent(row.response?.body);
    if (!content) {
      failedReviewIds.add(review.id);
      continue;
    }

    const extraction = parseExtractionContent(content);
    if (!extraction) {
      failedReviewIds.add(review.id);
      continue;
    }
    parsedUpdates.push({ review, extraction });
  }

  if (failedReviewIds.size > 0) {
    console.log(`Rescuing ${failedReviewIds.size} malformed NLP rows with direct retries...`);
    const rescuedUpdates = await rescueFailedBatchRows(
      client,
      metadata.reviews.filter(review => failedReviewIds.has(review.id)),
    );
    parsedUpdates.push(...rescuedUpdates);
  }

  const reviewUpserts = parsedUpdates.map(({ review, extraction }) => ({
    id: review.id,
    hotel_id: review.hotel_id,
    source: review.source,
    source_review_id: review.source_review_id,
    lang: review.lang,
    sentiment: extraction.overall_sentiment,
    sentiment_score: extraction.overall_sentiment_score,
    topics: extraction.aspects,
    guest_segment: inferGuestSegment(extraction.guest_persona, review.trip_type),
    guest_persona: extraction.guest_persona,
    content_seeds: extraction.content_seeds,
    competitor_mentions: extraction.competitor_mentions,
    nlp_processed_at: new Date().toISOString(),
  }));
  await upsertReviewNlpRows(reviewUpserts);

  const topicRowsPayload = dedupeTopicRows(parsedUpdates.flatMap(({ review, extraction }) =>
    extraction.aspects.map(aspect => ({
      hotel_id: review.hotel_id,
      review_id: review.id,
      aspect: aspect.aspect,
      sentiment: aspect.sentiment,
      sentiment_score: aspect.score,
      mention_text: aspect.mention,
      lang: review.lang,
      published_date: review.published_date,
    })),
  ));
  await replaceReviewTopicRows(parsedUpdates.map(({ review }) => review.id), topicRowsPayload);

  const embeddings = await generateEmbeddings(
    client,
    parsedUpdates.map(({ review }) => ({ id: review.id, text: review.text })),
  );

  const embeddingRows = parsedUpdates.map(({ review }) => review).map(review => ({
    id: review.id,
    hotel_id: review.hotel_id,
    source: review.source,
    source_review_id: review.source_review_id,
    lang: review.lang,
    embedding: toHalfvecLiteral(embeddings.find(row => row.id === review.id)?.embedding ?? []),
  }));
  await upsertReviewNlpRows(embeddingRows);

  return {
    updatedReviews: parsedUpdates.length,
    topicRows: topicRowsPayload.length,
    embeddedReviews: embeddings.length,
  };
}

async function pollBatchUntilDone(
  client: OpenAI,
  metadata: PersistedBatchMetadata,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    const batch = await client.batches.retrieve(metadata.batchId);
    metadata.status = batch.status;
    metadata.outputFileId = batch.output_file_id ?? null;
    metadata.errorFileId = batch.error_file_id ?? null;
    metadata.completedAt = batch.completed_at ? new Date(batch.completed_at * 1000).toISOString() : null;
    saveMetadata(metadata);

    if (batch.status === 'completed' && batch.output_file_id) {
      const applied = await applyCompletedBatch(client, metadata, batch.output_file_id);
      await refreshDashboardViews();
      console.log(`Applied batch ${metadata.batchId}: ${applied.updatedReviews} reviews, ${applied.topicRows} topic rows, ${applied.embeddedReviews} embeddings`);
      return;
    }

    if (['failed', 'cancelled', 'expired'].includes(batch.status)) {
      throw new Error(`Batch ${metadata.batchId} ended with status ${batch.status}`);
    }

    console.log(`Batch ${metadata.batchId} status=${batch.status} ... waiting`);
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Timed out waiting for batch ${metadata.batchId}`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(BATCH_DIR, { recursive: true });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const client = getOpenAiClient();

  if (options.batchId) {
    const metadata = loadMetadata(options.batchId);
    await pollBatchUntilDone(client, metadata);
    return;
  }

  const reviews = await fetchUnprocessedReviews(options.limit);
  if (!reviews.length) {
    console.log('No unprocessed reviews found.');
    return;
  }

  const baseMetadata = await createReviewNlpBatch(client, reviews);
  const metadata: PersistedBatchMetadata = {
    ...baseMetadata,
    reviews,
  };
  saveMetadata(metadata);

  console.log(`Created NLP batch ${metadata.batchId} for ${metadata.reviewCount} reviews`);
  console.log(`Metadata saved to ${metadataPath(metadata.batchId)}`);

  if (options.wait) {
    await pollBatchUntilDone(client, metadata);
  } else {
    console.log(`Poll later with: npm run nlp:extract -- --batch-id ${metadata.batchId}`);
  }
}

main().catch(error => {
  console.error('NLP extraction failed:', error);
  process.exit(1);
});
