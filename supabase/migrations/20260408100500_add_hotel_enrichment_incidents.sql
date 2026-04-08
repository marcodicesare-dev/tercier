create table if not exists public.hotel_enrichment_incidents (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hotels(id) on delete set null,
  hotel_name text not null,
  city text,
  country text,
  incident_type text not null,
  source text,
  severity text not null default 'error',
  message text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists hotel_enrichment_incidents_hotel_name_idx
  on public.hotel_enrichment_incidents (hotel_name, created_at desc);

create index if not exists hotel_enrichment_incidents_hotel_id_idx
  on public.hotel_enrichment_incidents (hotel_id, created_at desc);
