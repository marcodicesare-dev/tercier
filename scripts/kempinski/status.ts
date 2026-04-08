import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { KEMPINSKI_TARGETS } from './targets.js';

loadEnv({ path: resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const COMPLETE_STATUSES = new Set(['hotel_enrichment_complete', 'computed']);
const ACTIVE_STATUSES = new Set(['hotel_enrichment_running', 'ta_matched']);
const REVIEW_STATUSES = new Set(['identity_review_required']);
const LOCAL_STATUS_FILE = resolve(process.cwd(), 'output/kempinski-worker/status.json');

interface HotelRow {
  id: string;
  name: string | null;
  city: string | null;
  enrichment_status: string | null;
  updated_at: string | null;
  website_url?: string | null;
  dp_website_content_languages?: string | null;
}

interface JobRow {
  id: string;
  target_name: string;
  city: string | null;
  country: string | null;
  status: string;
  attempt_count: number;
  retry_at: string;
  lease_expires_at: string | null;
  last_error: string | null;
}

function isExpired(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  const timestamp = Date.parse(isoString);
  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function fetchHotelRows(): Promise<HotelRow[]> {
  const rows: HotelRow[] = [];
  for (const batch of chunkArray(KEMPINSKI_TARGETS, 40)) {
    const { data, error } = await supabase
      .from('hotels')
      .select('id,name,city,enrichment_status,updated_at,website_url,dp_website_content_languages')
      .in('name', batch.map(target => target.name));
    if (error) throw error;
    rows.push(...((data ?? []) as HotelRow[]));
  }
  return rows;
}

async function fetchReviewCounts(hotelIds: string[]): Promise<{ total: number; processed: number; pending: number }> {
  if (!hotelIds.length) {
    return { total: 0, processed: 0, pending: 0 };
  }

  const { count: total, error: totalError } = await supabase
    .from('hotel_reviews')
    .select('id', { count: 'exact', head: true })
    .in('hotel_id', hotelIds)
    .not('text', 'is', null);
  if (totalError) throw totalError;

  const { count: processed, error: processedError } = await supabase
    .from('hotel_reviews')
    .select('id', { count: 'exact', head: true })
    .in('hotel_id', hotelIds)
    .not('text', 'is', null)
    .not('nlp_processed_at', 'is', null);
  if (processedError) throw processedError;

  return {
    total: total ?? 0,
    processed: processed ?? 0,
    pending: Math.max((total ?? 0) - (processed ?? 0), 0),
  };
}

async function fetchJobs(): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from('kempinski_enrichment_jobs')
    .select('id,target_name,city,country,status,attempt_count,retry_at,lease_expires_at,last_error')
    .eq('phase', 'enrichment')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as JobRow[];
}

async function main(): Promise<void> {
  const rows = await fetchHotelRows();
  const jobs = await fetchJobs();
  const reviewCounts = await fetchReviewCounts(rows.map(row => row.id));
  const fallbackPendingTargets = KEMPINSKI_TARGETS.filter(target => {
    const row = rows.find(candidate => candidate.name === target.name);
    return !row || (!COMPLETE_STATUSES.has(row.enrichment_status ?? '') && !REVIEW_STATUSES.has(row.enrichment_status ?? ''));
  }).map(target => target.name);
  const pendingTargets = jobs.length > 0
    ? jobs.filter(job => job.status === 'queued' || job.status === 'retrying').map(job => job.target_name)
    : fallbackPendingTargets;
  const websiteSignalBacklog = rows.filter(row =>
    COMPLETE_STATUSES.has(row.enrichment_status ?? '') &&
    row.website_url &&
    !row.dp_website_content_languages,
  ).length;
  const reviewRequired = rows.filter(row => REVIEW_STATUSES.has(row.enrichment_status ?? ''));
  const queuedJobs = jobs.filter(job => job.status === 'queued');
  const runningJobs = jobs.filter(job => job.status === 'running');
  const staleRunningJobs = runningJobs.filter(job => isExpired(job.lease_expires_at));
  const retryingJobs = jobs.filter(job => job.status === 'retrying');
  const quarantinedJobs = jobs.filter(job => job.status === 'quarantined');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  const liveStatus = {
    generatedAt: new Date().toISOString(),
    expectedHotels: KEMPINSKI_TARGETS.length,
    dbHotels: rows.length,
    completedHotels: rows.filter(row => COMPLETE_STATUSES.has(row.enrichment_status ?? '')).length,
    activeHotels: rows.filter(row => ACTIVE_STATUSES.has(row.enrichment_status ?? '')).length,
    partialHotels: rows.filter(
      row =>
        !COMPLETE_STATUSES.has(row.enrichment_status ?? '') &&
        !ACTIVE_STATUSES.has(row.enrichment_status ?? '') &&
        !REVIEW_STATUSES.has(row.enrichment_status ?? ''),
    ).length,
    reviewRequiredHotels: reviewRequired.length,
    pendingHotels: pendingTargets.length,
    enrichmentJobs: {
      total: jobs.length,
      queued: queuedJobs.length,
      running: runningJobs.length,
      staleRunning: staleRunningJobs.length,
      retrying: retryingJobs.length,
      quarantined: quarantinedJobs.length,
      failed: failedJobs.length,
      queueUnseeded: jobs.length === 0,
    },
    websiteSignalBacklog,
    reviewCounts,
    active: rows
      .filter(row => ACTIVE_STATUSES.has(row.enrichment_status ?? ''))
      .map(row => ({ name: row.name, city: row.city, status: row.enrichment_status, updated_at: row.updated_at })),
    reviewRequired: reviewRequired.map(row => ({
      name: row.name,
      city: row.city,
      status: row.enrichment_status,
      updated_at: row.updated_at,
    })),
    queuedJobs: queuedJobs.slice(0, 15).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      retry_at: job.retry_at,
    })),
    retryingJobs: retryingJobs.slice(0, 15).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      retry_at: job.retry_at,
      last_error: job.last_error,
    })),
    staleRunningJobs: staleRunningJobs.slice(0, 15).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      lease_expires_at: job.lease_expires_at,
      last_error: job.last_error,
    })),
    pending: pendingTargets.slice(0, 15),
  };

  let localStatus: unknown = null;
  if (existsSync(LOCAL_STATUS_FILE)) {
    try {
      localStatus = JSON.parse(readFileSync(LOCAL_STATUS_FILE, 'utf8'));
    } catch {
      localStatus = null;
    }
  }

  process.stdout.write(`${JSON.stringify({ liveStatus, localStatus }, null, 2)}\n`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
