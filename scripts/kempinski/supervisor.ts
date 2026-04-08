import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hostname } from 'node:os';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import { stringify } from 'csv-stringify/sync';
import { createClient } from '@supabase/supabase-js';
import { KEMPINSKI_TARGETS, type HotelTarget } from './targets.js';

loadEnv({ path: resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'FIRECRAWL_API_KEY',
  'FIBER_API_KEY',
  'TRIPADVISOR_API_KEY',
  'GOOGLE_PLACES_API_KEY',
  'SERPAPI_KEY',
  'DATAFORSEO_LOGIN',
  'DATAFORSEO_PASSWORD',
] as const;

const missingEnvVars = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

if (missingEnvVars.length) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const COMPLETE_STATUSES = new Set(['hotel_enrichment_complete', 'computed']);
const ACTIVE_STATUSES = new Set(['hotel_enrichment_running', 'ta_matched']);
const REVIEW_STATUSES = new Set(['identity_review_required']);
const STATE_DIR = resolve(process.cwd(), 'output/kempinski-worker');
const LOG_FILE = resolve(STATE_DIR, 'supervisor.log');
const STATUS_FILE = resolve(STATE_DIR, 'status.json');
const FINAL_FILE = resolve(STATE_DIR, 'final-verification.json');
const CONTACT_INPUT_FILE = resolve(STATE_DIR, 'contact-input.csv');
const CONTACT_OUTPUT_DIR = resolve(process.cwd(), 'output/hotel-contact-enrichment-kempinski');
const CONTACT_SUMMARY_FILE = resolve(CONTACT_OUTPUT_DIR, 'decision-maker-summary.json');
const BATCH_SIZE = Number.parseInt(process.env.KEMPINSKI_BATCH_SIZE ?? '1', 10) || 1;
const MAX_RETRIES = Number.parseInt(process.env.KEMPINSKI_MAX_RETRIES ?? '20', 10) || 20;
const RETRY_DELAY_MS = Number.parseInt(process.env.KEMPINSKI_RETRY_DELAY_MS ?? '30000', 10) || 30000;
const MONITOR_INTERVAL_MS = Number.parseInt(process.env.KEMPINSKI_MONITOR_INTERVAL_MS ?? '60000', 10) || 60000;
const IDLE_INTERVAL_MS = Number.parseInt(process.env.KEMPINSKI_IDLE_INTERVAL_MS ?? '300000', 10) || 300000;
const SHUTDOWN_GRACE_MS = Number.parseInt(process.env.KEMPINSKI_SHUTDOWN_GRACE_MS ?? '30000', 10) || 30000;
const COMMAND_TIMEOUT_MS = Number.parseInt(process.env.KEMPINSKI_COMMAND_TIMEOUT_MS ?? '1800000', 10) || 1800000;
const LEASE_NAME = 'kempinski_enrichment_supervisor';
const LEASE_TTL_SECONDS = Math.max(
  Math.ceil(Math.max(MONITOR_INTERVAL_MS, IDLE_INTERVAL_MS) / 1000) + 120,
  180,
);
const ENRICHMENT_JOB_PHASE = 'enrichment';
const ENRICHMENT_JOB_LEASE_SECONDS = Number.parseInt(process.env.KEMPINSKI_JOB_LEASE_SECONDS ?? '1800', 10) || 1800;
const WORKER_SESSION_ID = `${hostname()}-${process.pid}-${Date.now()}`;

let shuttingDown = false;
let currentChild: ChildProcessWithoutNullStreams | null = null;
let currentEnrichmentJob: KempinskiJobRow | null = null;
let hasCompletedContactSweep = false;
let leaderHeartbeat: NodeJS.Timeout | null = null;
let leaderLockAcquired = false;

interface HotelRow {
  id: string;
  name: string | null;
  city: string | null;
  country: string | null;
  website_url?: string | null;
  dp_website_primary_language?: string | null;
  dp_website_content_languages?: string | null;
  dp_website_language_count?: number | null;
  ta_address_string?: string | null;
  gp_formatted_address?: string | null;
  cx_gm_email?: string | null;
  hs_gm_email?: string | null;
  cx_gm_name?: string | null;
  hs_gm_name?: string | null;
  cx_gm_title?: string | null;
  hs_gm_title?: string | null;
  enrichment_status: string | null;
  updated_at?: string | null;
  computed_at?: string | null;
}

interface ReviewProgress {
  total: number;
  processed: number;
  pending: number;
}

interface KempinskiJobRow {
  id: string;
  target_name: string;
  city: string | null;
  country: string | null;
  phase: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  retry_at: string;
  lease_expires_at: string | null;
  worker_id: string | null;
  hotel_id: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

function isExpired(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  const timestamp = Date.parse(isoString);
  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

class ShutdownRequestedError extends Error {
  constructor() {
    super('Shutdown requested');
  }
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  mkdirSync(STATE_DIR, { recursive: true });
  appendFileSync(LOG_FILE, `${line}\n`, 'utf8');
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

function assertNotShuttingDown(): void {
  if (shuttingDown) {
    throw new ShutdownRequestedError();
  }
}

function chunkArray<T>(items: T[], size: number): T[][]
{
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function fetchHotelRows(): Promise<HotelRow[]> {
  const rows: HotelRow[] = [];
  for (const batch of chunkArray(KEMPINSKI_TARGETS, 40)) {
    const names = batch.map(target => target.name);
    const { data, error } = await supabase
      .from('hotels')
      .select('id,name,city,country,website_url,dp_website_primary_language,dp_website_content_languages,dp_website_language_count,ta_address_string,gp_formatted_address,cx_gm_email,hs_gm_email,cx_gm_name,hs_gm_name,cx_gm_title,hs_gm_title,enrichment_status,updated_at,computed_at')
      .in('name', names);
    if (error) throw error;
    rows.push(...((data ?? []) as HotelRow[]));
  }
  return rows;
}

async function ensureEnrichmentJobs(): Promise<void> {
  const hotelRows = await fetchHotelRows();
  const rowByName = new Map(hotelRows.map(row => [row.name ?? '', row]));
  const rows = KEMPINSKI_TARGETS.map(target => ({
    target_name: target.name,
    city: target.city ?? null,
    country: target.country ?? null,
    phase: ENRICHMENT_JOB_PHASE,
    status: (() => {
      const row = rowByName.get(target.name);
      if (row && COMPLETE_STATUSES.has(row.enrichment_status ?? '')) return 'succeeded';
      if (row && REVIEW_STATUSES.has(row.enrichment_status ?? '')) return 'quarantined';
      return 'queued';
    })(),
    priority: 100,
    max_attempts: MAX_RETRIES,
  }));
  const { error } = await supabase
    .from('kempinski_enrichment_jobs')
    .upsert(rows, { onConflict: 'target_name,phase', ignoreDuplicates: true });
  if (error) throw error;
}

async function reconcileEnrichmentJobsWithHotels(): Promise<void> {
  const hotelRows = await fetchHotelRows();
  const jobs = await fetchEnrichmentJobs();
  const rowByName = new Map(hotelRows.map(row => [row.name ?? '', row]));

  for (const job of jobs) {
    if (!['queued', 'retrying'].includes(job.status)) continue;
    const row = rowByName.get(job.target_name);
    if (!row) continue;

    if (COMPLETE_STATUSES.has(row.enrichment_status ?? '')) {
      await supabase
        .from('kempinski_enrichment_jobs')
        .update({
          status: 'succeeded',
          hotel_id: row.id,
          completed_at: new Date().toISOString(),
          last_error: null,
          lease_expires_at: null,
          result: { reconciled_from_hotel_status: row.enrichment_status },
        })
        .eq('id', job.id);
      continue;
    }

    if (REVIEW_STATUSES.has(row.enrichment_status ?? '')) {
      await supabase
        .from('kempinski_enrichment_jobs')
        .update({
          status: 'quarantined',
          hotel_id: row.id,
          completed_at: new Date().toISOString(),
          lease_expires_at: null,
          result: { reconciled_from_hotel_status: row.enrichment_status },
        })
        .eq('id', job.id);
    }
  }
}

async function fetchEnrichmentJobs(): Promise<KempinskiJobRow[]> {
  const { data, error } = await supabase
    .from('kempinski_enrichment_jobs')
    .select('id,target_name,city,country,phase,status,attempt_count,max_attempts,retry_at,lease_expires_at,worker_id,hotel_id,last_error,created_at,updated_at')
    .eq('phase', ENRICHMENT_JOB_PHASE)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as KempinskiJobRow[];
}

async function claimEnrichmentJob(): Promise<KempinskiJobRow | null> {
  const { data, error } = await supabase.rpc('claim_kempinski_enrichment_job', {
    p_worker_id: WORKER_SESSION_ID,
    p_phase: ENRICHMENT_JOB_PHASE,
    p_lease_seconds: ENRICHMENT_JOB_LEASE_SECONDS,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return (rows[0] as KempinskiJobRow | undefined) ?? null;
}

async function renewEnrichmentJobLease(jobId: string): Promise<void> {
  const { data, error } = await supabase.rpc('renew_kempinski_enrichment_job_lease', {
    p_job_id: jobId,
    p_worker_id: WORKER_SESSION_ID,
    p_lease_seconds: ENRICHMENT_JOB_LEASE_SECONDS,
  });
  if (error) throw error;
  if (!data) {
    throw new Error(`job lease renewal failed for ${jobId}`);
  }
}

async function completeEnrichmentJob(jobId: string, status: 'succeeded' | 'quarantined' | 'failed', hotelId: string | null, result: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.rpc('complete_kempinski_enrichment_job', {
    p_job_id: jobId,
    p_worker_id: WORKER_SESSION_ID,
    p_status: status,
    p_hotel_id: hotelId,
    p_result: result,
  });
  if (error) throw error;
  if (!data) throw new Error(`job completion failed for ${jobId}`);
}

async function failEnrichmentJob(jobId: string, errorMessage: string): Promise<void> {
  const { data, error } = await supabase.rpc('fail_kempinski_enrichment_job', {
    p_job_id: jobId,
    p_worker_id: WORKER_SESSION_ID,
    p_error: errorMessage,
    p_retry_delay_seconds: Math.max(Math.round(RETRY_DELAY_MS / 1000), 30),
  });
  if (error) throw error;
  if (!data) throw new Error(`job failure update failed for ${jobId}`);
}

async function recoverStaleEnrichmentJobs(): Promise<number> {
  const { data, error } = await supabase.rpc('recover_stale_kempinski_enrichment_jobs', {
    p_phase: ENRICHMENT_JOB_PHASE,
    p_reason: 'job lease expired before completion',
  });
  if (error) throw error;
  return Number(data ?? 0);
}

async function fetchReviewProgress(hotelIds: string[]): Promise<ReviewProgress> {
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

async function findHotelForTarget(target: HotelTarget): Promise<HotelRow | null> {
  let query = supabase
    .from('hotels')
    .select('id,name,city,country,website_url,dp_website_primary_language,dp_website_content_languages,dp_website_language_count,ta_address_string,gp_formatted_address,cx_gm_email,hs_gm_email,cx_gm_name,hs_gm_name,cx_gm_title,hs_gm_title,enrichment_status,updated_at,computed_at')
    .eq('name', target.name);
  if (target.city) {
    query = query.eq('city', target.city);
  }
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data?.[0] as HotelRow | undefined) ?? null;
}

function computePendingTargets(rows: HotelRow[]): HotelTarget[] {
  const rowByName = new Map(rows.map(row => [row.name ?? '', row]));
  return KEMPINSKI_TARGETS.filter(target => {
    const row = rowByName.get(target.name);
    return !row || (!COMPLETE_STATUSES.has(row.enrichment_status ?? '') && !REVIEW_STATUSES.has(row.enrichment_status ?? ''));
  });
}

function hasContactBacklog(rows: HotelRow[]): boolean {
  return rows.some(row =>
    COMPLETE_STATUSES.has(row.enrichment_status ?? '') &&
    !row.cx_gm_email &&
    !row.hs_gm_email &&
    !row.cx_gm_name &&
    !row.hs_gm_name,
  );
}

function computeWebsiteSignalBackfillTargets(rows: HotelRow[]): HotelTarget[] {
  const rowByName = new Map(rows.map(row => [row.name ?? '', row]));
  return KEMPINSKI_TARGETS.filter(target => {
    const row = rowByName.get(target.name);
    return Boolean(
      row &&
      COMPLETE_STATUSES.has(row.enrichment_status ?? '') &&
      row.website_url &&
      !row.dp_website_content_languages,
    );
  });
}

async function buildStatus(extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const rows = await fetchHotelRows();
  const jobs = await fetchEnrichmentJobs();
  const pendingTargets = computePendingTargets(rows);
  const reviewProgress = await fetchReviewProgress(rows.map(row => row.id));
  const completed = rows.filter(row => COMPLETE_STATUSES.has(row.enrichment_status ?? ''));
  const active = rows.filter(row => ACTIVE_STATUSES.has(row.enrichment_status ?? ''));
  const partial = rows.filter(
    row =>
      !COMPLETE_STATUSES.has(row.enrichment_status ?? '') &&
      !ACTIVE_STATUSES.has(row.enrichment_status ?? '') &&
      !REVIEW_STATUSES.has(row.enrichment_status ?? ''),
  );
  const reviewRequired = rows.filter(row => REVIEW_STATUSES.has(row.enrichment_status ?? ''));
  const queuedJobs = jobs.filter(job => job.status === 'queued');
  const runningJobs = jobs.filter(job => job.status === 'running');
  const staleRunningJobs = runningJobs.filter(job => isExpired(job.lease_expires_at));
  const retryingJobs = jobs.filter(job => job.status === 'retrying');
  const quarantinedJobs = jobs.filter(job => job.status === 'quarantined');
  const failedJobs = jobs.filter(job => job.status === 'failed');
  const succeededJobs = jobs.filter(job => job.status === 'succeeded');

  const status = {
    updatedAt: new Date().toISOString(),
    workerSessionId: WORKER_SESSION_ID,
    hostname: hostname(),
    pid: process.pid,
    shuttingDown,
    leaderLockAcquired,
    expectedHotels: KEMPINSKI_TARGETS.length,
    dbHotels: rows.length,
    completedHotels: completed.length,
    activeHotels: active.length,
    partialHotels: partial.length,
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
      succeeded: succeededJobs.length,
    },
    contactBacklogHotels: rows.filter(row =>
      COMPLETE_STATUSES.has(row.enrichment_status ?? '') &&
      !row.cx_gm_email &&
      !row.hs_gm_email &&
      !row.cx_gm_name &&
      !row.hs_gm_name,
    ).length,
    websiteSignalBacklogHotels: computeWebsiteSignalBackfillTargets(rows).length,
    reviewProgress,
    completed: completed.map(row => ({
      name: row.name,
      city: row.city,
      status: row.enrichment_status,
      updated_at: row.updated_at ?? null,
    })),
    active: active.map(row => ({
      name: row.name,
      city: row.city,
      status: row.enrichment_status,
      updated_at: row.updated_at ?? null,
    })),
    partial: partial.map(row => ({
      name: row.name,
      city: row.city,
      status: row.enrichment_status,
      updated_at: row.updated_at ?? null,
    })),
    reviewRequired: reviewRequired.map(row => ({
      name: row.name,
      city: row.city,
      status: row.enrichment_status,
      updated_at: row.updated_at ?? null,
    })),
    queuedJobs: queuedJobs.slice(0, 10).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      retry_at: job.retry_at,
    })),
    retryingJobs: retryingJobs.slice(0, 10).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      retry_at: job.retry_at,
      last_error: job.last_error,
    })),
    staleRunningJobs: staleRunningJobs.slice(0, 10).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      lease_expires_at: job.lease_expires_at,
      last_error: job.last_error,
    })),
    quarantinedJobs: quarantinedJobs.slice(0, 10).map(job => ({
      name: job.target_name,
      city: job.city,
      attempts: job.attempt_count,
      last_error: job.last_error,
    })),
    ...extra,
  };

  writeJson(STATUS_FILE, status);
  return status;
}

async function acquireLeaderLock(): Promise<boolean> {
  const { data, error } = await supabase.rpc('acquire_worker_lease', {
    p_lock_name: LEASE_NAME,
    p_owner_id: WORKER_SESSION_ID,
    p_ttl_seconds: LEASE_TTL_SECONDS,
  });
  if (error) throw error;
  leaderLockAcquired = Boolean(data);
  return leaderLockAcquired;
}

function startLeaderHeartbeat(): void {
  if (leaderHeartbeat) return;
  leaderHeartbeat = setInterval(() => {
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('renew_worker_lease', {
          p_lock_name: LEASE_NAME,
          p_owner_id: WORKER_SESSION_ID,
          p_ttl_seconds: LEASE_TTL_SECONDS,
        });

        if (error) {
          log(`leader_heartbeat: ${error.message}`);
          return;
        }

        if (!data) {
          leaderLockAcquired = false;
          log('leader_heartbeat: lease renewal failed, returning to standby');
          if (currentChild && !currentChild.killed) {
            log(`leader_heartbeat: terminating child pid=${currentChild.pid ?? 'unknown'} after lease loss`);
            currentChild.kill('SIGTERM');
            setTimeout(() => {
              if (currentChild && !currentChild.killed) {
                currentChild.kill('SIGKILL');
              }
            }, SHUTDOWN_GRACE_MS).unref();
          }
        }
      } catch (error) {
        log(`leader_heartbeat: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }, Math.max(30000, Math.min(MONITOR_INTERVAL_MS, 120000)));
  leaderHeartbeat.unref();
}

async function releaseLeaderLock(): Promise<void> {
  if (leaderHeartbeat) {
    clearInterval(leaderHeartbeat);
    leaderHeartbeat = null;
  }

  if (leaderLockAcquired) {
    try {
      const { error } = await supabase.rpc('release_worker_lease', {
        p_lock_name: LEASE_NAME,
        p_owner_id: WORKER_SESSION_ID,
      });
      if (error) throw error;
    } catch (error) {
      log(`leader_unlock: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      leaderLockAcquired = false;
    }
  }
}

function handleSignal(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`supervisor: received ${signal}, draining`);

  if (currentChild && !currentChild.killed) {
    currentChild.kill(signal);
    setTimeout(() => {
      if (currentChild && !currentChild.killed) {
        currentChild.kill('SIGKILL');
      }
    }, SHUTDOWN_GRACE_MS).unref();
  }
}

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

async function runCommand(label: string, args: string[]): Promise<void> {
  assertNotShuttingDown();
  log(`${label}: starting ${args.join(' ')}`);

  const child = spawn(args[0], args.slice(1), {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  currentChild = child;

  const monitor = setInterval(() => {
    void (async () => {
      try {
        if (currentEnrichmentJob) {
          await renewEnrichmentJobLease(currentEnrichmentJob.id);
        }
        await buildStatus({
          phase: label,
          childPid: child.pid ?? null,
          currentEnrichmentJobId: currentEnrichmentJob?.id ?? null,
          currentEnrichmentTarget: currentEnrichmentJob?.target_name ?? null,
        });
      } catch (error) {
        log(`${label}: monitor error ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }, MONITOR_INTERVAL_MS);
  monitor.unref();

  child.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    appendFileSync(LOG_FILE, chunk);
  });
  child.stderr.on('data', chunk => {
    process.stderr.write(chunk);
    appendFileSync(LOG_FILE, chunk);
  });

  const timeout = setTimeout(() => {
    log(`${label}: timeout after ${COMMAND_TIMEOUT_MS}ms, terminating child pid=${child.pid ?? 'unknown'}`);
    if (!child.killed) {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, SHUTDOWN_GRACE_MS).unref();
    }
  }, COMMAND_TIMEOUT_MS);
  timeout.unref();

  const exitCode = await new Promise<number>((resolvePromise, reject) => {
    child.on('error', reject);
    child.on('exit', code => resolvePromise(code ?? 1));
  });

  clearTimeout(timeout);
  clearInterval(monitor);
  currentChild = null;
  await buildStatus({ phase: label, childPid: null, lastExitCode: exitCode });

  if (shuttingDown) {
    throw new ShutdownRequestedError();
  }

  if (exitCode !== 0) {
    throw new Error(`${label} exited with code ${exitCode}`);
  }
  log(`${label}: completed`);
}

async function runWithRetries(label: string, runner: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    assertNotShuttingDown();
    try {
      await runner();
      return;
    } catch (error) {
      if (error instanceof ShutdownRequestedError || shuttingDown) {
        throw new ShutdownRequestedError();
      }
      const message = error instanceof Error ? error.message : String(error);
      log(`${label}: attempt ${attempt}/${MAX_RETRIES} failed: ${message}`);
      await buildStatus({ phase: label, error: message, retryAttempt: attempt });
      if (attempt === MAX_RETRIES) throw error;
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function runEnrichmentPhase(): Promise<void> {
  await ensureEnrichmentJobs();

  while (true) {
    assertNotShuttingDown();
    const job = await claimEnrichmentJob();
    if (!job) {
      log('enrichment: no queued or retryable Kempinski enrichment jobs remain');
      return;
    }

    currentEnrichmentJob = job;
    const target: HotelTarget = {
      name: job.target_name,
      city: job.city ?? undefined,
      country: job.country ?? undefined,
    };

    await buildStatus({
      phase: 'enrichment',
      currentJob: {
        id: job.id,
        name: job.target_name,
        city: job.city,
        country: job.country,
        attempts: job.attempt_count,
      },
    });

    try {
      await runCommand('enrichment_batch', [
        'npm',
        'run',
        'enrich',
        '--',
        '--json',
        JSON.stringify([target]),
      ]);

      const hotel = await findHotelForTarget(target);
      const enrichmentStatus = hotel?.enrichment_status ?? null;
      if (enrichmentStatus && COMPLETE_STATUSES.has(enrichmentStatus)) {
        await completeEnrichmentJob(job.id, 'succeeded', hotel?.id ?? null, {
          enrichment_status: enrichmentStatus,
        });
      } else if (enrichmentStatus && REVIEW_STATUSES.has(enrichmentStatus)) {
        await completeEnrichmentJob(job.id, 'quarantined', hotel?.id ?? null, {
          enrichment_status: enrichmentStatus,
        });
      } else {
        throw new Error(`unexpected post-run hotel state for ${target.name}: ${enrichmentStatus ?? 'missing row'}`);
      }
    } catch (error) {
      if (error instanceof ShutdownRequestedError || shuttingDown) {
        throw new ShutdownRequestedError();
      }
      const message = error instanceof Error ? error.message : String(error);
      await failEnrichmentJob(job.id, message);
      log(`enrichment_job: ${job.target_name} failed attempt ${job.attempt_count}/${job.max_attempts}: ${message}`);
    } finally {
      currentEnrichmentJob = null;
    }
  }
}

async function runWebsiteSignalBackfillPhase(): Promise<void> {
  while (true) {
    assertNotShuttingDown();
    const rows = await fetchHotelRows();
    const pendingTargets = computeWebsiteSignalBackfillTargets(rows);
    if (!pendingTargets.length) {
      log('website_signal_backfill: no completed Kempinski hotels missing website language signals');
      return;
    }

    const batch = pendingTargets.slice(0, BATCH_SIZE);
    await buildStatus({
      phase: 'website_signal_backfill',
      batchSize: batch.length,
      nextBatch: batch.map(target => target.name),
    });

    await runWithRetries('website_signal_backfill_batch', async () => {
      await runCommand('website_signal_backfill_batch', [
        'npm',
        'run',
        'enrich',
        '--',
        '--json',
        JSON.stringify(batch),
      ]);
    });
  }
}

async function refreshViews(): Promise<void> {
  const { error } = await supabase.rpc('refresh_dashboard_views');
  if (error) throw error;
  log('refresh_views: completed');
}

async function runNlpPhase(): Promise<void> {
  while (true) {
    assertNotShuttingDown();
    const rows = await fetchHotelRows();
    const reviewProgress = await fetchReviewProgress(rows.map(row => row.id));
    await buildStatus({ phase: 'nlp', reviewProgress });

    if (reviewProgress.pending === 0) {
      log('nlp: no pending review NLP rows remain');
      return;
    }

    await runWithRetries('nlp_batch', async () => {
      await runCommand('nlp_batch', ['npm', 'run', 'nlp:extract', '--', '--wait']);
    });
  }
}

async function buildContactInput(rows: HotelRow[]): Promise<number> {
  const csv = stringify(
    rows.map(row => ({
      slug: row.name ? row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '',
      name: row.name ?? '',
      location: row.city ?? '',
      address: row.ta_address_string ?? row.gp_formatted_address ?? '',
      websiteUrl: row.website_url ?? '',
      email: row.cx_gm_email ?? row.hs_gm_email ?? '',
      gmName: row.cx_gm_name ?? row.hs_gm_name ?? '',
      gmTitle: row.cx_gm_title ?? row.hs_gm_title ?? '',
      gmSourceUrl: '',
    })),
    {
      header: true,
      columns: ['slug', 'name', 'location', 'address', 'websiteUrl', 'email', 'gmName', 'gmTitle', 'gmSourceUrl'],
    },
  );

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(CONTACT_INPUT_FILE, csv);
  return rows.length;
}

async function runContactPhase(): Promise<void> {
  assertNotShuttingDown();
  const rows = await fetchHotelRows();
  const rowCount = await buildContactInput(rows);
  await buildStatus({ phase: 'contacts', contactRows: rowCount, contactInput: CONTACT_INPUT_FILE });

  await runWithRetries('contact_enrichment', async () => {
    await runCommand('contact_enrichment', [
      'npm',
      'run',
      'enrich:hotel-contacts',
      '--',
      '--input',
      CONTACT_INPUT_FILE,
      '--output-dir',
      CONTACT_OUTPUT_DIR,
      '--only-missing',
    ]);
  });

  if (!existsSync(CONTACT_SUMMARY_FILE)) {
    throw new Error(`Missing contact summary at ${CONTACT_SUMMARY_FILE}`);
  }

  hasCompletedContactSweep = true;
}

async function writeFinalVerification(): Promise<void> {
  const rows = await fetchHotelRows();
  const reviewProgress = await fetchReviewProgress(rows.map(row => row.id));
  const status = await buildStatus({ phase: 'done', reviewProgress });

  const verification = {
    generatedAt: new Date().toISOString(),
    status,
    contactSummaryPath: CONTACT_SUMMARY_FILE,
  };
  writeJson(FINAL_FILE, verification);
}

async function main(): Promise<void> {
  mkdirSync(STATE_DIR, { recursive: true });
  log(
    `supervisor: started lease_mode=supabase batch_size=${BATCH_SIZE} max_retries=${MAX_RETRIES} ttl_seconds=${LEASE_TTL_SECONDS} session=${WORKER_SESSION_ID}`,
  );

  while (!shuttingDown) {
    if (!leaderLockAcquired) {
      const locked = await acquireLeaderLock();
      if (!locked) {
        await buildStatus({ phase: 'standby', reason: 'leader lock held by another worker' });
        log('supervisor: waiting for leader lock');
        await sleep(IDLE_INTERVAL_MS);
        continue;
      }
      startLeaderHeartbeat();
      log('supervisor: acquired leader lock');
    }

    await ensureEnrichmentJobs();
    const recoveredJobs = await recoverStaleEnrichmentJobs();
    if (recoveredJobs > 0) {
      log(`enrichment_recovery: re-queued ${recoveredJobs} stale running job(s)`);
    }
    await reconcileEnrichmentJobsWithHotels();
    const rows = await fetchHotelRows();
    const jobs = await fetchEnrichmentJobs();
    const reviewProgress = await fetchReviewProgress(rows.map(row => row.id));
    const pendingEnrichmentJobs = jobs.filter(job => job.status === 'queued' || job.status === 'retrying');
    const websiteSignalBackfillTargets = computeWebsiteSignalBackfillTargets(rows);
    const contactBacklog = hasContactBacklog(rows);
    const shouldRunEnrichment = pendingEnrichmentJobs.length > 0;
    const shouldRunWebsiteSignalBackfill = !shouldRunEnrichment && websiteSignalBackfillTargets.length > 0;
    const shouldRunNlp = reviewProgress.pending > 0;
    const shouldRunContacts = (shouldRunEnrichment || shouldRunWebsiteSignalBackfill || shouldRunNlp || (!hasCompletedContactSweep && contactBacklog));

    if (!shouldRunEnrichment && !shouldRunWebsiteSignalBackfill && !shouldRunNlp && !shouldRunContacts) {
      await buildStatus({
        phase: 'idle',
        idleReason: 'no pending enrichment, website-signal backfill, NLP, or contact backlog',
      });
      await sleep(IDLE_INTERVAL_MS);
      continue;
    }

    await buildStatus({
      phase: 'planning',
      shouldRunEnrichment,
      shouldRunWebsiteSignalBackfill,
      shouldRunNlp,
      shouldRunContacts,
      pendingBatchPreview: pendingEnrichmentJobs.slice(0, BATCH_SIZE).map(job => job.target_name),
      websiteSignalBackfillPreview: websiteSignalBackfillTargets.slice(0, BATCH_SIZE).map(target => target.name),
      reviewProgress,
    });

    if (shouldRunEnrichment) {
      await runEnrichmentPhase();
      await refreshViews();
    }

    if (shouldRunWebsiteSignalBackfill) {
      await runWebsiteSignalBackfillPhase();
      await refreshViews();
    }

    if (shouldRunNlp) {
      await runNlpPhase();
      await refreshViews();
    }

    if (shouldRunContacts) {
      await runContactPhase();
      await refreshViews();
    }

    await writeFinalVerification();
    log('supervisor: cycle complete');
  }

  throw new ShutdownRequestedError();
}

main().catch(async error => {
  if (error instanceof ShutdownRequestedError || shuttingDown) {
    log('supervisor: shutdown complete');
    await buildStatus({ phase: 'stopped', reason: 'shutdown requested' }).catch(() => undefined);
    await releaseLeaderLock().catch(() => undefined);
    process.exit(0);
  }

  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  log(`supervisor: fatal ${message}`);
  await buildStatus({ phase: 'failed', error: message }).catch(() => undefined);
  await releaseLeaderLock().catch(() => undefined);
  process.exit(1);
});
