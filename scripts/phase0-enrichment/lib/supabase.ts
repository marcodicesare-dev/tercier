import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.\n' +
    'Create a .env file with both values. Get them from your Supabase project settings.',
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DEFAULT_PAGE_SIZE = 1000;

export async function fetchAllRows<T>(fetchPage: (
  from: number,
  to: number,
) => Promise<{ data: T[] | null; error: { message: string } | null }>, limit = Infinity): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const remaining = Number.isFinite(limit) ? limit - rows.length : DEFAULT_PAGE_SIZE;
    if (remaining <= 0) break;

    const pageSize = Math.min(DEFAULT_PAGE_SIZE, remaining);
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += data.length;
  }

  return rows;
}

/**
 * Log a pipeline run start.
 * Returns the run ID for later update.
 */
export async function logPipelineStart(step: string, hotelsTotal: number): Promise<string> {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .insert({
      step,
      status: 'running',
      hotels_total: hotelsTotal,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to log pipeline start: ${error.message}`);
    return 'unknown';
  }
  return data.id;
}

/**
 * Log a pipeline run completion.
 */
export async function logPipelineEnd(
  runId: string,
  status: 'completed' | 'failed',
  stats: { processed?: number; matched?: number; failed?: number; error?: string },
): Promise<void> {
  const { error } = await supabase
    .from('pipeline_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      hotels_processed: stats.processed ?? 0,
      hotels_matched: stats.matched ?? 0,
      hotels_failed: stats.failed ?? 0,
      error_message: stats.error ?? null,
    })
    .eq('id', runId);

  if (error) {
    console.error(`Failed to log pipeline end: ${error.message}`);
  }
}

export async function refreshDashboardViews(): Promise<void> {
  const { error } = await supabase.rpc('refresh_dashboard_views');
  if (error) {
    console.error(`Failed to refresh dashboard views: ${error.message}`);
  }
}
