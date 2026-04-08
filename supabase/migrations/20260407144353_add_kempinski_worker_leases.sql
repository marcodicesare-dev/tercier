create table if not exists public.worker_leases (
  lock_name text primary key,
  owner_id text not null,
  acquired_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.worker_leases enable row level security;

revoke all on public.worker_leases from anon, authenticated;
grant select, insert, update, delete on public.worker_leases to service_role;

create or replace function public.acquire_worker_lease(
  p_lock_name text,
  p_owner_id text,
  p_ttl_seconds integer default 180
)
returns boolean
language sql
as $$
  with lease as (
    insert into public.worker_leases (
      lock_name,
      owner_id,
      acquired_at,
      heartbeat_at,
      expires_at
    )
    values (
      p_lock_name,
      p_owner_id,
      now(),
      now(),
      now() + make_interval(secs => greatest(p_ttl_seconds, 30))
    )
    on conflict (lock_name) do update
      set owner_id = excluded.owner_id,
          acquired_at = case
            when public.worker_leases.owner_id = excluded.owner_id then public.worker_leases.acquired_at
            else now()
          end,
          heartbeat_at = now(),
          expires_at = now() + make_interval(secs => greatest(p_ttl_seconds, 30))
    where public.worker_leases.owner_id = excluded.owner_id
       or public.worker_leases.expires_at <= now()
    returning owner_id
  )
  select exists(select 1 from lease where owner_id = p_owner_id);
$$;

create or replace function public.renew_worker_lease(
  p_lock_name text,
  p_owner_id text,
  p_ttl_seconds integer default 180
)
returns boolean
language sql
as $$
  with lease as (
    update public.worker_leases
       set heartbeat_at = now(),
           expires_at = now() + make_interval(secs => greatest(p_ttl_seconds, 30))
     where lock_name = p_lock_name
       and owner_id = p_owner_id
       and expires_at > now()
    returning owner_id
  )
  select exists(select 1 from lease where owner_id = p_owner_id);
$$;

create or replace function public.release_worker_lease(
  p_lock_name text,
  p_owner_id text
)
returns boolean
language sql
as $$
  with lease as (
    delete from public.worker_leases
     where lock_name = p_lock_name
       and owner_id = p_owner_id
    returning owner_id
  )
  select exists(select 1 from lease where owner_id = p_owner_id);
$$;

revoke execute on function public.acquire_worker_lease(text, text, integer) from anon, authenticated;
revoke execute on function public.renew_worker_lease(text, text, integer) from anon, authenticated;
revoke execute on function public.release_worker_lease(text, text) from anon, authenticated;

grant execute on function public.acquire_worker_lease(text, text, integer) to service_role;
grant execute on function public.renew_worker_lease(text, text, integer) to service_role;
grant execute on function public.release_worker_lease(text, text) to service_role;
