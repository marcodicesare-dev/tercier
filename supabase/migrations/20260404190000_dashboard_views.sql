-- Dashboard performance layer for the Lumina intelligence UI.
-- Pre-computes hotel-level aggregates so the UI never reads raw review/topic tables.

drop function if exists public.get_hotel_card(uuid);
drop function if exists public.refresh_dashboard_views();

drop materialized view if exists public.mv_content_seeds;
drop materialized view if exists public.mv_lang_breakdown;
drop materialized view if exists public.mv_guest_personas;
drop materialized view if exists public.mv_review_timeline;
drop materialized view if exists public.mv_hotel_topics;
drop materialized view if exists public.mv_hotel_dashboard;

create materialized view public.mv_hotel_dashboard as
with review_counts as (
  select
    hotel_id,
    count(*) as total_reviews_db,
    count(*) filter (where sentiment = 'positive') as positive_reviews,
    count(*) filter (where sentiment = 'negative') as negative_reviews
  from public.hotel_reviews
  group by hotel_id
),
competitor_counts as (
  select hotel_id, count(*) as competitor_count
  from public.hotel_competitors
  group by hotel_id
),
topic_counts as (
  select hotel_id, count(*) as topic_mentions_total
  from public.review_topic_index
  group by hotel_id
)
select
  h.id as hotel_id,
  h.name,
  h.city,
  h.country,
  h.ta_rating,
  h.gp_rating,
  h.ta_num_reviews,
  h.gp_user_rating_count,
  h.ta_ranking,
  h.ta_ranking_out_of,
  h.ta_ranking_geo,
  h.ta_brand,
  h.ta_parent_brand,
  h.ta_price_level,
  h.ta_category,
  h.score_hqi,
  h.score_tos,
  h.score_reputation_risk,
  h.score_digital_presence,
  h.ta_primary_segment,
  h.ta_segment_pct_business,
  h.ta_segment_pct_couples,
  h.ta_segment_pct_solo,
  h.ta_segment_pct_family,
  h.ta_segment_pct_friends,
  h.ta_segment_diversity,
  h.ta_subrating_location,
  h.ta_subrating_sleep,
  h.ta_subrating_rooms,
  h.ta_subrating_service,
  h.ta_subrating_value,
  h.ta_subrating_cleanliness,
  h.ta_subrating_weakest,
  h.ta_subrating_strongest,
  h.ta_subrating_range,
  h.ta_owner_response_rate,
  h.ta_review_language_count,
  h.ta_reviews_last_90d_est,
  h.ta_amenity_count,
  h.gp_editorial_summary,
  h.gp_review_summary_gemini,
  h.website_url,
  h.qna_count,
  h.qna_unanswered_count,
  h.gmb_is_claimed,
  h.gmb_hotel_star_rating,
  h.seo_domain_authority,
  h.dp_website_tech_cms,
  h.dp_website_tech_booking,
  h.dp_website_tech_analytics,
  h.price_direct,
  h.price_lowest_ota,
  h.price_parity_score,
  h.enrichment_status,
  h.flag_is_independent,
  h.flag_is_luxury,
  h.flag_is_premium,
  h.flag_needs_reputation_mgmt,
  h.flag_tercier_high_priority,
  coalesce(rc.total_reviews_db, 0) as total_reviews_db,
  coalesce(rc.positive_reviews, 0) as positive_reviews,
  coalesce(rc.negative_reviews, 0) as negative_reviews,
  coalesce(cc.competitor_count, 0) as competitor_count,
  coalesce(tc.topic_mentions_total, 0) as topic_mentions_total,
  h.updated_at
from public.hotels h
left join review_counts rc on rc.hotel_id = h.id
left join competitor_counts cc on cc.hotel_id = h.id
left join topic_counts tc on tc.hotel_id = h.id
where h.enrichment_status is not null;

create unique index idx_mv_hotel_dashboard_id on public.mv_hotel_dashboard(hotel_id);
create index idx_mv_hotel_dashboard_quality on public.mv_hotel_dashboard(score_hqi desc nulls last, score_tos desc nulls last);

create materialized view public.mv_hotel_topics as
select
  hotel_id,
  aspect,
  count(*) as mention_count,
  count(*) filter (where sentiment = 'positive') as positive_count,
  count(*) filter (where sentiment = 'negative') as negative_count,
  count(*) filter (where sentiment = 'neutral') as neutral_count,
  count(*) filter (where sentiment = 'mixed') as mixed_count,
  round(100.0 * count(*) filter (where sentiment = 'positive') / nullif(count(*), 0), 1) as positive_pct,
  round(100.0 * count(*) filter (where sentiment = 'negative') / nullif(count(*), 0), 1) as negative_pct,
  round(avg(sentiment_score)::numeric, 3) as avg_sentiment_score
from public.review_topic_index
group by hotel_id, aspect;

create unique index idx_mv_hotel_topics_pk on public.mv_hotel_topics(hotel_id, aspect);
create index idx_mv_hotel_topics_hotel_mentions on public.mv_hotel_topics(hotel_id, mention_count desc);

create materialized view public.mv_review_timeline as
select
  hotel_id,
  date_trunc('month', published_date)::date as month,
  count(*) as review_count,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*) filter (where sentiment = 'positive') as positive,
  count(*) filter (where sentiment = 'negative') as negative,
  count(*) filter (where sentiment = 'neutral') as neutral,
  count(*) filter (where sentiment = 'mixed') as mixed
from public.hotel_reviews
where published_date is not null
group by hotel_id, date_trunc('month', published_date);

create unique index idx_mv_review_timeline_pk on public.mv_review_timeline(hotel_id, month);

create materialized view public.mv_guest_personas as
select
  hotel_id,
  guest_persona ->> 'occasion' as occasion,
  guest_persona ->> 'spending_level' as spending_level,
  guest_persona ->> 'group_detail' as group_detail,
  count(*) as review_count,
  round(avg(rating)::numeric, 2) as avg_rating
from public.hotel_reviews
where guest_persona is not null
  and guest_persona != 'null'::jsonb
group by hotel_id, guest_persona ->> 'occasion', guest_persona ->> 'spending_level', guest_persona ->> 'group_detail';

create index idx_mv_guest_personas_hotel on public.mv_guest_personas(hotel_id, review_count desc);

create materialized view public.mv_lang_breakdown as
select
  hotel_id,
  lang,
  count(*) as review_count,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*) filter (where sentiment = 'positive') as positive,
  count(*) filter (where sentiment = 'negative') as negative,
  count(*) filter (where sentiment = 'neutral') as neutral,
  count(*) filter (where sentiment = 'mixed') as mixed
from public.hotel_reviews
where lang is not null
group by hotel_id, lang;

create unique index idx_mv_lang_breakdown_pk on public.mv_lang_breakdown(hotel_id, lang);

create materialized view public.mv_content_seeds as
select
  r.hotel_id,
  seed ->> 'quote' as quote,
  seed ->> 'emotion' as emotion,
  seed ->> 'segment' as segment,
  seed ->> 'use' as marketing_use,
  r.lang,
  r.rating,
  r.published_date,
  r.id as review_id
from public.hotel_reviews r
cross join lateral jsonb_array_elements(coalesce(r.content_seeds, '[]'::jsonb)) as seed
where r.content_seeds is not null
  and jsonb_typeof(r.content_seeds) = 'array'
  and jsonb_array_length(r.content_seeds) > 0;

create index idx_mv_content_seeds_hotel on public.mv_content_seeds(hotel_id, published_date desc);

create or replace function public.get_hotel_card(target_hotel_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'hotel',
    (
      select row_to_json(d)
      from public.mv_hotel_dashboard d
      where d.hotel_id = target_hotel_id
    ),
    'topics',
    (
      select coalesce(jsonb_agg(row_to_json(t) order by t.mention_count desc), '[]'::jsonb)
      from public.mv_hotel_topics t
      where t.hotel_id = target_hotel_id
    ),
    'timeline',
    (
      select coalesce(jsonb_agg(row_to_json(tl) order by tl.month), '[]'::jsonb)
      from public.mv_review_timeline tl
      where tl.hotel_id = target_hotel_id
    ),
    'competitors',
    (
      select coalesce(jsonb_agg(row_to_json(cn) order by cn.competitor_rank), '[]'::jsonb)
      from public.competitive_network cn
      where cn.hotel_id = target_hotel_id
    ),
    'languages',
    (
      select coalesce(jsonb_agg(row_to_json(lb) order by lb.review_count desc), '[]'::jsonb)
      from public.mv_lang_breakdown lb
      where lb.hotel_id = target_hotel_id
    ),
    'personas',
    (
      select coalesce(jsonb_agg(row_to_json(gp) order by gp.review_count desc), '[]'::jsonb)
      from (
        select *
        from public.mv_guest_personas gp
        where gp.hotel_id = target_hotel_id
        order by gp.review_count desc
        limit 20
      ) gp
    ),
    'content_seeds',
    (
      select coalesce(jsonb_agg(row_to_json(cs) order by cs.published_date desc), '[]'::jsonb)
      from (
        select *
        from public.mv_content_seeds cs
        where cs.hotel_id = target_hotel_id
        order by cs.published_date desc
        limit 30
      ) cs
    ),
    'qna',
    (
      select coalesce(jsonb_agg(row_to_json(q) order by q.question_date desc), '[]'::jsonb)
      from (
        select
          id,
          question,
          question_author,
          question_date,
          answer_count,
          has_answer,
          has_official_answer,
          latest_answer,
          latest_answered_by,
          latest_answer_date
        from public.hotel_qna
        where hotel_id = target_hotel_id
        order by question_date desc nulls last, created_at desc
        limit 10
      ) q
    )
  );
$$;

create or replace function public.refresh_dashboard_views()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.mv_hotel_dashboard;
  refresh materialized view public.mv_hotel_topics;
  refresh materialized view public.mv_review_timeline;
  refresh materialized view public.mv_guest_personas;
  refresh materialized view public.mv_lang_breakdown;
  refresh materialized view public.mv_content_seeds;
end;
$$;

comment on materialized view public.mv_hotel_dashboard is 'Dashboard summary per hotel. Reads from hotels plus pre-counted reviews, competitors, and topic totals for instant portfolio rendering.';
comment on materialized view public.mv_hotel_topics is 'Aspect sentiment aggregation per hotel. Powers sentiment-by-topic charts without scanning review_topic_index at request time.';
comment on materialized view public.mv_review_timeline is 'Monthly review volume and sentiment timeline per hotel.';
comment on materialized view public.mv_guest_personas is 'Aggregated guest persona dimensions extracted from review NLP.';
comment on materialized view public.mv_lang_breakdown is 'Per-language review counts, ratings, and sentiment counts per hotel.';
comment on materialized view public.mv_content_seeds is 'Flattened marketing-ready content seeds extracted from hotel reviews.';
comment on function public.get_hotel_card(uuid) is 'Single-call dashboard payload for a hotel intelligence card.';
comment on function public.refresh_dashboard_views() is 'Refreshes all dashboard materialized views after enrichment/NLP writes.';

select public.refresh_dashboard_views();
