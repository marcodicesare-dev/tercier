create or replace function public.recover_stale_kempinski_enrichment_jobs(
  p_phase text default 'enrichment',
  p_reason text default 'job lease expired before completion'
)
returns integer
language plpgsql
as $$
declare
  v_recovered integer := 0;
begin
  update public.kempinski_enrichment_jobs
  set status = case
        when attempt_count >= max_attempts then 'failed'
        else 'retrying'
      end,
      retry_at = now(),
      lease_expires_at = null,
      worker_id = null,
      completed_at = case
        when attempt_count >= max_attempts then now()
        else null
      end,
      last_error = trim(both from concat_ws(' | ', nullif(last_error, ''), p_reason)),
      updated_at = now()
  where phase = p_phase
    and status = 'running'
    and lease_expires_at is not null
    and lease_expires_at <= now();

  get diagnostics v_recovered = row_count;
  return v_recovered;
end;
$$;

revoke execute on function public.recover_stale_kempinski_enrichment_jobs(text, text) from anon, authenticated;
grant execute on function public.recover_stale_kempinski_enrichment_jobs(text, text) to service_role;
