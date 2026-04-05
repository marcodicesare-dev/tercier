-- Deep intelligence database upgrade
-- Additive only: extends review corpus, temporal tracking, AI query layer, and price history.

create extension if not exists vector with schema extensions;

alter table public.hotel_reviews add column if not exists sentiment text;
alter table public.hotel_reviews add column if not exists sentiment_score real;
alter table public.hotel_reviews add column if not exists topics jsonb;
alter table public.hotel_reviews add column if not exists guest_segment text;
alter table public.hotel_reviews add column if not exists nlp_processed_at timestamptz;
alter table public.hotel_reviews add column if not exists embedding extensions.halfvec(512);

create index if not exists idx_reviews_hotel_lang on public.hotel_reviews(hotel_id, lang);
create index if not exists idx_reviews_hotel_date on public.hotel_reviews(hotel_id, published_date desc);
create index if not exists idx_reviews_hotel_sentiment on public.hotel_reviews(hotel_id, sentiment);
create index if not exists idx_reviews_hotel_rating on public.hotel_reviews(hotel_id, rating);

do $$
begin
  if exists (
    select 1
    from pg_opclass
    join pg_am on pg_am.oid = pg_opclass.opcmethod
    where opcname = 'halfvec_cosine_ops'
      and pg_am.amname = 'hnsw'
  ) then
    execute 'create index if not exists idx_reviews_embedding on public.hotel_reviews using hnsw ((embedding) extensions.halfvec_cosine_ops)';
  end if;
end
$$;

create table if not exists public.review_topic_index (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  review_id uuid not null references public.hotel_reviews(id) on delete cascade,
  aspect text not null,
  sentiment text not null,
  sentiment_score real,
  mention_text text,
  lang text not null,
  published_date timestamptz,
  created_at timestamptz default now(),
  unique(review_id, aspect)
);

create index if not exists idx_topic_hotel on public.review_topic_index(hotel_id);
create index if not exists idx_topic_aspect on public.review_topic_index(aspect);
create index if not exists idx_topic_hotel_aspect on public.review_topic_index(hotel_id, aspect, sentiment);
create index if not exists idx_topic_date on public.review_topic_index(published_date);

create table if not exists public.hotel_metric_snapshots (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  snapshot_date date not null default current_date,
  snapshot_source text not null default 'pipeline',
  ta_rating real,
  ta_num_reviews int,
  gp_rating real,
  gp_user_rating_count int,
  ta_ranking int,
  ta_ranking_out_of int,
  ta_subrating_location real,
  ta_subrating_sleep real,
  ta_subrating_rooms real,
  ta_subrating_service real,
  ta_subrating_value real,
  ta_subrating_cleanliness real,
  ta_trip_type_business int,
  ta_trip_type_couples int,
  ta_trip_type_solo int,
  ta_trip_type_family int,
  ta_trip_type_friends int,
  score_hqi real,
  score_tos real,
  score_reputation_risk real,
  ta_owner_response_rate real,
  ta_owner_response_count int,
  seo_domain_authority int,
  seo_monthly_traffic_est int,
  ta_rating_vs_compset real,
  ta_reviews_vs_compset_ratio real,
  created_at timestamptz default now(),
  unique(hotel_id, snapshot_date)
);

create index if not exists idx_metric_snapshots_hotel_date on public.hotel_metric_snapshots(hotel_id, snapshot_date desc);
create index if not exists idx_metric_snapshots_date on public.hotel_metric_snapshots(snapshot_date);

create table if not exists public.hotel_price_snapshots (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  check_date date not null,
  check_in_date date,
  nights int default 1,
  currency text default 'USD',
  price_booking_com real,
  price_expedia real,
  price_hotels_com real,
  price_agoda real,
  price_direct real,
  price_lowest_ota real,
  price_parity_score real,
  ota_count int,
  raw_response jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_prices_hotel_date on public.hotel_price_snapshots(hotel_id, check_date desc);
create index if not exists idx_prices_date on public.hotel_price_snapshots(check_date);
create index if not exists idx_prices_brin on public.hotel_price_snapshots using brin(check_date);

create index if not exists idx_competitors_competitor_hotel on public.hotel_competitors(competitor_hotel_id);

comment on table public.hotels is 'Core hotel intelligence. One row per hotel. Summary card across identity, ratings, amenities, competitive position, SEO, contacts, pricing, and computed scores.';
comment on table public.hotel_reviews is 'Review corpus from TripAdvisor and Google. Raw text, rating, language, owner responses, future NLP columns, and future semantic embeddings.';
comment on table public.hotel_metric_snapshots is 'Periodic metric snapshots for temporal analysis and What Changed reporting. One row per hotel per snapshot date.';
comment on table public.hotel_competitors is 'Competitive set per hotel. competitor_hotel_id links competitors as first-class hotels in the same hotels table.';
comment on table public.hotel_price_snapshots is 'Time series of OTA and direct pricing snapshots, used for parity analysis and pricing trend reports.';
comment on table public.review_topic_index is 'Denormalized aspect-level sentiment extracted from reviews. Designed for fast aggregation by hotel, aspect, sentiment, and date.';
comment on table public.hotel_amenities is 'Normalized amenity inventory per hotel. Source-specific rows used for scoring and boolean convenience flags.';

comment on column public.hotels.score_hqi is 'Hotel Quality Index (0-1). Composite of rating, review volume, subrating consistency, and response behavior.';
comment on column public.hotels.score_tos is 'Tercier Opportunity Score (0-1). Higher means stronger commercial sales opportunity.';
comment on column public.hotels.ta_rating_vs_compset is 'TripAdvisor rating minus competitive set average. Positive means outperforming the compset.';
comment on column public.hotels.ta_segment_diversity is 'Shannon entropy of guest segments. Higher means a more diverse mix of guest needs.';
comment on column public.hotels.flag_needs_reputation_mgmt is 'True when response rate is low and negative reviews are materially present.';
comment on column public.hotel_reviews.topics is 'JSONB array of extracted aspects and sentiment, for example [{aspect, sentiment, score, mention}].';
comment on column public.hotel_reviews.embedding is 'halfvec(512) semantic embedding, intended for similarity search via match_reviews().';
comment on column public.hotel_competitors.competitor_hotel_id is 'Linked hotel row for this competitor when the competitor has been enriched as a first-class hotel.';

create or replace function public.ai_schema_catalog()
returns table (table_name text, table_description text, row_count bigint, column_count int)
language sql
stable
as $$
  select
    c.relname::text as table_name,
    d.description::text as table_description,
    c.reltuples::bigint as row_count,
    (
      select count(*)::int
      from information_schema.columns ic
      where ic.table_schema = 'public'
        and ic.table_name = c.relname
    ) as column_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_description d on d.objoid = c.oid and d.objsubid = 0
  where n.nspname = 'public'
    and c.relkind in ('r', 'v', 'm')
  order by c.relname;
$$;

create or replace function public.match_reviews(
  query_embedding extensions.halfvec(512),
  target_hotel_id uuid default null,
  target_lang text default null,
  match_threshold float default 0.75,
  match_count int default 20
)
returns table (
  id uuid,
  hotel_id uuid,
  text text,
  lang text,
  rating real,
  sentiment text,
  topics jsonb,
  published_date timestamptz,
  similarity float
)
language sql
stable
as $$
  select
    r.id,
    r.hotel_id,
    r.text,
    r.lang,
    r.rating,
    r.sentiment,
    r.topics,
    r.published_date,
    1 - (r.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.hotel_reviews r
  where r.embedding is not null
    and (target_hotel_id is null or r.hotel_id = target_hotel_id)
    and (target_lang is null or r.lang = target_lang)
    and 1 - (r.embedding operator(extensions.<=>) query_embedding) > match_threshold
  order by r.embedding operator(extensions.<=>) query_embedding asc
  limit match_count;
$$;

create or replace function public.hotel_changes(
  target_hotel_id uuid,
  days_back int default 30
)
returns table (
  metric text,
  previous real,
  current real,
  delta real,
  prev_date date,
  curr_date date
)
language sql
stable
as $$
  with curr as (
    select *
    from public.hotel_metric_snapshots
    where hotel_id = target_hotel_id
    order by snapshot_date desc
    limit 1
  ),
  prev as (
    select *
    from public.hotel_metric_snapshots
    where hotel_id = target_hotel_id
      and snapshot_date <= current_date - days_back
    order by snapshot_date desc
    limit 1
  )
  select 'ta_rating', p.ta_rating, c.ta_rating, c.ta_rating - p.ta_rating, p.snapshot_date, c.snapshot_date
  from curr c cross join prev p
  where (c.ta_rating - p.ta_rating) is distinct from 0
  union all
  select 'ta_num_reviews', p.ta_num_reviews::real, c.ta_num_reviews::real, (c.ta_num_reviews - p.ta_num_reviews)::real, p.snapshot_date, c.snapshot_date
  from curr c cross join prev p
  where ((c.ta_num_reviews - p.ta_num_reviews)::real) is distinct from 0
  union all
  select 'ta_ranking', p.ta_ranking::real, c.ta_ranking::real, (c.ta_ranking - p.ta_ranking)::real, p.snapshot_date, c.snapshot_date
  from curr c cross join prev p
  where ((c.ta_ranking - p.ta_ranking)::real) is distinct from 0
  union all
  select 'gp_rating', p.gp_rating, c.gp_rating, c.gp_rating - p.gp_rating, p.snapshot_date, c.snapshot_date
  from curr c cross join prev p
  where (c.gp_rating - p.gp_rating) is distinct from 0
  union all
  select 'score_hqi', p.score_hqi, c.score_hqi, c.score_hqi - p.score_hqi, p.snapshot_date, c.snapshot_date
  from curr c cross join prev p
  where (c.score_hqi - p.score_hqi) is distinct from 0
  union all
  select 'ta_owner_response_rate', p.ta_owner_response_rate, c.ta_owner_response_rate, c.ta_owner_response_rate - p.ta_owner_response_rate, p.snapshot_date, c.snapshot_date
  from curr c cross join prev p
  where (c.ta_owner_response_rate - p.ta_owner_response_rate) is distinct from 0;
$$;

create or replace view public.competitive_network as
select
  h.id as hotel_id,
  h.name as hotel_name,
  h.city,
  h.ta_rating as hotel_rating,
  c.competitor_rank,
  c.distance_km,
  ch.id as competitor_id,
  ch.name as competitor_name,
  ch.ta_rating as competitor_rating,
  ch.ta_subrating_service as competitor_service,
  ch.ta_subrating_rooms as competitor_rooms,
  ch.ta_subrating_value as competitor_value,
  ch.ta_price_level as competitor_price_level,
  ch.score_hqi as competitor_hqi
from public.hotel_competitors c
join public.hotels h on c.hotel_id = h.id
left join public.hotels ch on c.competitor_hotel_id = ch.id;
