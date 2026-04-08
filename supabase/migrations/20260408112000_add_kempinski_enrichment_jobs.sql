create table if not exists public.kempinski_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  target_name text not null,
  city text,
  country text,
  phase text not null default 'enrichment',
  status text not null default 'queued',
  priority integer not null default 100,
  attempt_count integer not null default 0,
  max_attempts integer not null default 20,
  retry_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  worker_id text,
  hotel_id uuid references public.hotels(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kempinski_enrichment_jobs_status_check
    check (status in ('queued', 'running', 'retrying', 'succeeded', 'quarantined', 'failed'))
);

create unique index if not exists kempinski_enrichment_jobs_target_phase_idx
  on public.kempinski_enrichment_jobs (target_name, phase);

create index if not exists kempinski_enrichment_jobs_status_retry_idx
  on public.kempinski_enrichment_jobs (phase, status, retry_at, priority, created_at);

create or replace function public.set_kempinski_enrichment_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kempinski_enrichment_jobs_updated_at on public.kempinski_enrichment_jobs;
create trigger trg_kempinski_enrichment_jobs_updated_at
before update on public.kempinski_enrichment_jobs
for each row
execute function public.set_kempinski_enrichment_jobs_updated_at();

create or replace function public.claim_kempinski_enrichment_job(
  p_worker_id text,
  p_phase text default 'enrichment',
  p_lease_seconds integer default 1800
)
returns setof public.kempinski_enrichment_jobs
language plpgsql
as $$
begin
  return query
  with next_job as (
    select id
    from public.kempinski_enrichment_jobs
    where phase = p_phase
      and status in ('queued', 'retrying')
      and retry_at <= now()
      and (lease_expires_at is null or lease_expires_at < now())
    order by priority asc, created_at asc
    for update skip locked
    limit 1
  )
  update public.kempinski_enrichment_jobs job
  set status = 'running',
      attempt_count = job.attempt_count + 1,
      worker_id = p_worker_id,
      lease_expires_at = now() + make_interval(secs => greatest(p_lease_seconds, 60)),
      started_at = coalesce(job.started_at, now()),
      updated_at = now()
  from next_job
  where job.id = next_job.id
  returning job.*;
end;
$$;

create or replace function public.renew_kempinski_enrichment_job_lease(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 1800
)
returns boolean
language plpgsql
as $$
declare
  v_updated integer := 0;
begin
  update public.kempinski_enrichment_jobs
  set lease_expires_at = now() + make_interval(secs => greatest(p_lease_seconds, 60)),
      updated_at = now()
  where id = p_job_id
    and worker_id = p_worker_id
    and status = 'running';

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.complete_kempinski_enrichment_job(
  p_job_id uuid,
  p_worker_id text,
  p_status text,
  p_hotel_id uuid default null,
  p_result jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
as $$
declare
  v_updated integer := 0;
begin
  if p_status not in ('succeeded', 'quarantined', 'failed') then
    raise exception 'Invalid completion status: %', p_status;
  end if;

  update public.kempinski_enrichment_jobs
  set status = p_status,
      hotel_id = coalesce(p_hotel_id, hotel_id),
      result = coalesce(p_result, '{}'::jsonb),
      lease_expires_at = null,
      completed_at = now(),
      updated_at = now()
  where id = p_job_id
    and worker_id = p_worker_id;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.fail_kempinski_enrichment_job(
  p_job_id uuid,
  p_worker_id text,
  p_error text,
  p_retry_delay_seconds integer default 300
)
returns boolean
language plpgsql
as $$
declare
  v_job public.kempinski_enrichment_jobs;
  v_updated integer := 0;
begin
  select *
  into v_job
  from public.kempinski_enrichment_jobs
  where id = p_job_id
    and worker_id = p_worker_id
  for update;

  if not found then
    return false;
  end if;

  update public.kempinski_enrichment_jobs
  set status = case when v_job.attempt_count >= v_job.max_attempts then 'failed' else 'retrying' end,
      last_error = p_error,
      retry_at = case
        when v_job.attempt_count >= v_job.max_attempts then now()
        else now() + make_interval(secs => greatest(p_retry_delay_seconds, 30))
      end,
      lease_expires_at = null,
      completed_at = case when v_job.attempt_count >= v_job.max_attempts then now() else null end,
      updated_at = now()
  where id = p_job_id;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;
