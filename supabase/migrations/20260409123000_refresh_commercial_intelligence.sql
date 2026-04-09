-- Refresh the commercial intelligence layer using the measured April 9, 2026
-- Kempinski corpus. This replaces weak signals (for example unanswered Q&A)
-- with the signals that actually differentiate hotels in the current dataset:
-- language mismatch, proof depth, pricing posture, content readiness,
-- and competitive pressure.

create or replace function public.normalize_lang_code(raw_lang text)
returns text
language sql
immutable
as $$
  select case
    when raw_lang is null or trim(raw_lang) = '' then null
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('en', 'enus', 'engb', 'enau', 'enca', 'english') then 'en'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('de', 'dede', 'deat', 'dech', 'german') then 'de'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('fr', 'frfr', 'frch', 'frbe', 'french') then 'fr'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('es', 'eses', 'esmx', 'spanish') then 'es'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('it', 'itit', 'italian') then 'it'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('pt', 'ptbr', 'ptpt', 'portuguese') then 'pt'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('ru', 'ruru', 'russian') then 'ru'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('ar', 'arsa', 'arae', 'arabic') then 'ar'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('zh', 'zhcn', 'zhhans', 'zhhant', 'zhtw', 'zhhk', 'cn', 'chinese') then 'zh'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('ja', 'jajp', 'japanese') then 'ja'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('ko', 'kokr', 'korean') then 'ko'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('tr', 'trtr', 'turkish') then 'tr'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('id', 'idid', 'indonesian') then 'id'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('th', 'thth', 'thai') then 'th'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('el', 'elgr', 'greek') then 'el'
    when lower(regexp_replace(trim(raw_lang), '[^a-zA-Z-]', '', 'g')) in ('pl', 'plpl', 'polish') then 'pl'
    else split_part(lower(trim(raw_lang)), '-', 1)
  end;
$$;

comment on function public.normalize_lang_code(text) is 'Normalizes raw locale / language tokens into a base language code used by commercial intelligence views.';

create or replace function public.language_display_name(raw_lang text)
returns text
language sql
immutable
as $$
  select case public.normalize_lang_code(raw_lang)
    when 'en' then 'English'
    when 'de' then 'German'
    when 'fr' then 'French'
    when 'es' then 'Spanish'
    when 'it' then 'Italian'
    when 'pt' then 'Portuguese'
    when 'ru' then 'Russian'
    when 'ar' then 'Arabic'
    when 'zh' then 'Chinese'
    when 'ja' then 'Japanese'
    when 'ko' then 'Korean'
    when 'tr' then 'Turkish'
    when 'id' then 'Indonesian'
    when 'th' then 'Thai'
    when 'el' then 'Greek'
    when 'pl' then 'Polish'
    when 'cs' then 'Czech'
    when 'nl' then 'Dutch'
    when 'ro' then 'Romanian'
    when 'sv' then 'Swedish'
    when 'no' then 'Norwegian'
    when 'hu' then 'Hungarian'
    when 'hr' then 'Croatian'
    when 'iw' then 'Hebrew'
    when 'he' then 'Hebrew'
    when 'gl' then 'Galician'
    when 'sn' then 'Shona'
    else initcap(coalesce(public.normalize_lang_code(raw_lang), trim(raw_lang)))
  end;
$$;

comment on function public.language_display_name(text) is 'Maps normalized language codes to human-readable names.';

create or replace function public.website_serves_language(raw_langs text, candidate text)
returns boolean
language sql
immutable
as $$
  with website_langs as (
    select public.normalize_lang_code(trim(lang)) as code
    from regexp_split_to_table(coalesce(raw_langs, ''), '[,|/]') as lang
  )
  select exists (
    select 1
    from website_langs
    where code is not null
      and code = public.normalize_lang_code(candidate)
  );
$$;

comment on function public.website_serves_language(text, text) is 'Returns true when the website language list effectively covers the candidate review language.';

drop view if exists public.v_market_intelligence;
drop view if exists public.v_hotel_opportunities;
drop view if exists public.v_chain_intelligence;
drop view if exists public.v_hotel_signal_facts;

create or replace view public.v_hotel_signal_facts as
with review_rollup as (
  select
    r.hotel_id,
    count(*) as total_reviews,
    count(*) filter (
      where r.nlp_processed_at is not null
        or r.sentiment is not null
        or (r.topics is not null and jsonb_typeof(r.topics) = 'array' and jsonb_array_length(r.topics) > 0)
    ) as processed_reviews,
    count(*) filter (where r.source = 'google') as google_reviews,
    count(*) filter (where r.source = 'tripadvisor') as tripadvisor_reviews
  from public.hotel_reviews r
  group by r.hotel_id
),
topic_rollup as (
  select
    t.hotel_id,
    count(*) as topic_rows,
    count(distinct t.aspect) as distinct_aspects
  from public.review_topic_index t
  group by t.hotel_id
),
seed_rollup as (
  select
    c.hotel_id,
    count(distinct c.review_id) as seed_review_count,
    count(distinct nullif(trim(c.quote), '')) as distinct_quote_count
  from public.mv_content_seeds c
  group by c.hotel_id
),
seed_emotion_ranked as (
  select
    c.hotel_id,
    c.emotion,
    count(*) as emotion_count,
    row_number() over (partition by c.hotel_id order by count(*) desc, c.emotion) as rn
  from public.mv_content_seeds c
  where c.emotion is not null and trim(c.emotion) <> ''
  group by c.hotel_id, c.emotion
),
latest_price as (
  select distinct on (p.hotel_id)
    p.hotel_id,
    p.check_date,
    p.price_direct,
    p.price_lowest_ota,
    p.price_parity_score,
    round((p.price_direct - p.price_lowest_ota)::numeric, 2) as direct_rate_delta,
    case
      when p.price_direct is null or p.price_lowest_ota is null then 'unknown'
      when abs(p.price_direct - p.price_lowest_ota) <= 5 then 'parity'
      when p.price_direct < p.price_lowest_ota then 'direct_cheaper'
      else 'ota_cheaper'
    end as direct_rate_position
  from public.hotel_price_snapshots p
  order by p.hotel_id, p.check_date desc nulls last
),
unserved_language_ranked as (
  select
    h.id as hotel_id,
    public.normalize_lang_code(lb.lang) as lang_code,
    public.language_display_name(lb.lang) as lang_name,
    lb.review_count,
    lb.avg_rating,
    row_number() over (partition by h.id order by lb.review_count desc, lb.lang) as rn
  from public.hotels h
  join public.mv_lang_breakdown lb on lb.hotel_id = h.id
  where public.normalize_lang_code(lb.lang) is not null
    and public.normalize_lang_code(lb.lang) <> 'en'
    and not public.website_serves_language(h.dp_website_content_languages, lb.lang)
),
unserved_language_rollup as (
  select
    hotel_id,
    count(*) as unserved_language_count,
    coalesce(sum(review_count), 0) as unserved_review_count,
    max(lang_code) filter (where rn = 1) as top_unserved_language,
    max(lang_name) filter (where rn = 1) as top_unserved_language_name,
    max(review_count) filter (where rn = 1) as top_unserved_language_reviews,
    max(avg_rating) filter (where rn = 1) as top_unserved_language_rating
  from unserved_language_ranked
  group by hotel_id
),
persona_spending_ranked as (
  select
    r.hotel_id,
    lower(r.guest_persona ->> 'spending_level') as spending_level,
    count(*) as review_count,
    row_number() over (partition by r.hotel_id order by count(*) desc, lower(r.guest_persona ->> 'spending_level')) as rn
  from public.hotel_reviews r
  where r.guest_persona is not null
    and r.guest_persona != 'null'::jsonb
    and coalesce(nullif(r.guest_persona ->> 'spending_level', ''), 'null') not in ('null', 'unknown')
  group by r.hotel_id, lower(r.guest_persona ->> 'spending_level')
),
persona_stay_ranked as (
  select
    r.hotel_id,
    lower(r.guest_persona ->> 'length_of_stay') as length_of_stay,
    count(*) as review_count,
    row_number() over (partition by r.hotel_id order by count(*) desc, lower(r.guest_persona ->> 'length_of_stay')) as rn
  from public.hotel_reviews r
  where r.guest_persona is not null
    and r.guest_persona != 'null'::jsonb
    and coalesce(nullif(r.guest_persona ->> 'length_of_stay', ''), 'null') not in ('null', 'unknown')
  group by r.hotel_id, lower(r.guest_persona ->> 'length_of_stay')
),
persona_repeat as (
  select
    r.hotel_id,
    count(*) filter (where r.guest_persona is not null and r.guest_persona != 'null'::jsonb) as persona_reviews,
    count(*) filter (
      where r.guest_persona is not null
        and r.guest_persona != 'null'::jsonb
        and (r.guest_persona ->> 'is_repeat_guest')::boolean is true
    ) as repeat_guest_reviews
  from public.hotel_reviews r
  group by r.hotel_id
),
competitor_threat_ranked as (
  select
    c.hotel_id,
    ch.name as competitor_name,
    ch.ta_rating as competitor_rating,
    c.distance_km,
    row_number() over (
      partition by c.hotel_id
      order by
        case when ch.ta_rating is null then 1 else 0 end,
        ch.ta_rating desc,
        c.distance_km asc nulls last
    ) as rn
  from public.hotel_competitors c
  left join public.hotels ch on ch.id = c.competitor_hotel_id
),
qna_rollup as (
  select
    q.hotel_id,
    count(*) as qna_count,
    count(*) filter (where q.has_answer is not true) as unanswered_qna_count,
    count(*) filter (where q.has_official_answer is true) as official_answer_count
  from public.hotel_qna q
  group by q.hotel_id
)
select
  h.id as hotel_id,
  h.name,
  h.city,
  h.country,
  h.enrichment_status,
  h.ta_brand,
  h.ta_parent_brand,
  h.ta_rating,
  h.gp_rating,
  h.score_hqi,
  h.ta_owner_response_rate,
  h.ta_review_language_count,
  h.dp_website_content_languages,
  h.computed_effective_website_langs,
  h.computed_language_gap,
  h.computed_value_gap,
  h.computed_opportunity_score,
  h.computed_opportunity_primary,
  h.computed_opportunity_narrative,
  coalesce(rr.total_reviews, 0) as total_reviews,
  coalesce(rr.processed_reviews, 0) as processed_reviews,
  round(coalesce(rr.processed_reviews::numeric / nullif(rr.total_reviews, 0), 0), 3) as processed_review_coverage,
  coalesce(rr.google_reviews, 0) as google_reviews,
  coalesce(rr.tripadvisor_reviews, 0) as tripadvisor_reviews,
  coalesce(tr.topic_rows, 0) as topic_rows,
  coalesce(tr.distinct_aspects, 0) as distinct_aspects,
  coalesce(sr.seed_review_count, 0) as seed_review_count,
  coalesce(sr.distinct_quote_count, 0) as distinct_quote_count,
  ser.emotion as dominant_seed_emotion,
  coalesce(ul.unserved_language_count, 0) as unserved_language_count,
  coalesce(ul.unserved_review_count, 0) as unserved_review_count,
  ul.top_unserved_language,
  ul.top_unserved_language_name,
  ul.top_unserved_language_reviews,
  ul.top_unserved_language_rating,
  lp.check_date as latest_price_check_date,
  lp.price_direct,
  lp.price_lowest_ota,
  lp.price_parity_score,
  lp.direct_rate_delta,
  lp.direct_rate_position,
  case
    when h.ta_rating is not null and h.ta_compset_avg_rating is not null
    then round((h.ta_rating - h.ta_compset_avg_rating)::numeric, 2)
    else null
  end as compset_rating_delta,
  ctr.competitor_name as top_competitor_name,
  ctr.competitor_rating as top_competitor_rating,
  ps.spending_level as dominant_spending_level,
  pst.length_of_stay as dominant_length_of_stay,
  case
    when pr.persona_reviews > 0
    then round((pr.repeat_guest_reviews::numeric / pr.persona_reviews), 3)
    else null
  end as repeat_guest_pct,
  coalesce(qr.qna_count, 0) as qna_count,
  coalesce(qr.unanswered_qna_count, 0) as unanswered_qna_count,
  coalesce(qr.official_answer_count, 0) as official_answer_count,
  case
    when coalesce(rr.total_reviews, 0) >= 250
      and coalesce(rr.processed_reviews, 0) >= 100
      and (h.ta_location_id is not null or h.gp_place_id is not null)
    then 'deep'
    when coalesce(rr.total_reviews, 0) > 0
      and (h.ta_location_id is not null or h.gp_place_id is not null or h.website_url is not null)
    then 'partial'
    else 'thin'
  end as proof_path_state
from public.hotels h
left join review_rollup rr on rr.hotel_id = h.id
left join topic_rollup tr on tr.hotel_id = h.id
left join seed_rollup sr on sr.hotel_id = h.id
left join seed_emotion_ranked ser on ser.hotel_id = h.id and ser.rn = 1
left join latest_price lp on lp.hotel_id = h.id
left join unserved_language_rollup ul on ul.hotel_id = h.id
left join persona_spending_ranked ps on ps.hotel_id = h.id and ps.rn = 1
left join persona_stay_ranked pst on pst.hotel_id = h.id and pst.rn = 1
left join persona_repeat pr on pr.hotel_id = h.id
left join competitor_threat_ranked ctr on ctr.hotel_id = h.id and ctr.rn = 1
left join qna_rollup qr on qr.hotel_id = h.id
where h.enrichment_status is not null;

comment on view public.v_hotel_signal_facts is 'Measured commercial facts per hotel: proof depth, language mismatch, pricing posture, content readiness, and competitive pressure.';

create or replace view public.v_market_intelligence as
select
  h.country,
  count(*) as hotel_count,
  sum(f.total_reviews) as total_reviews,
  round(avg(h.ta_rating)::numeric, 2) as avg_rating,
  round(avg(h.score_hqi)::numeric, 3) as avg_hqi,
  round(avg(h.computed_opportunity_score)::numeric, 3) as avg_opportunity_score,
  round(avg(h.computed_language_gap)::numeric, 2) as avg_language_gap,
  round(avg(h.computed_value_gap)::numeric, 2) as avg_value_gap,
  round(avg(h.ta_owner_response_rate)::numeric, 3) as avg_response_rate,
  count(*) filter (where f.proof_path_state = 'deep') as deep_proof_hotels,
  count(*) filter (where f.direct_rate_position = 'direct_cheaper') as direct_rate_advantage_hotels,
  count(*) filter (where (h.cx_gm_name is not null or h.cx_gm_email is not null or h.cx_gm_phone is not null)) as contact_ready_hotels,
  case
    when round(avg(h.computed_language_gap)::numeric, 2) >= 5
      then 'Language mismatch is the clearest commercial gap in this market.'
    when round(avg(h.computed_value_gap)::numeric, 2) >= 0.3
      then 'Value perception is the clearest pressure point in this market.'
    when round(avg(h.computed_opportunity_score)::numeric, 3) >= 0.35
      then 'This market has above-average commercial pressure even without a single dominant cause.'
    else 'This market is relatively healthy; use it more for proof than for urgency.'
  end as narrative
from public.hotels h
join public.v_hotel_signal_facts f on f.hotel_id = h.id
where h.enrichment_status is not null
group by h.country;

comment on view public.v_market_intelligence is 'Country-level commercial rollup for portfolio prioritization and market narratives.';

create or replace view public.v_chain_intelligence as
select
  coalesce(h.ta_parent_brand, h.ta_brand, 'Independent') as brand,
  count(*) as hotel_count,
  count(*) filter (where h.ta_rating is not null) as rated_hotels,
  round(avg(h.ta_rating)::numeric, 2) as avg_rating,
  round(min(h.ta_rating)::numeric, 2) as min_rating,
  round(max(h.ta_rating)::numeric, 2) as max_rating,
  round(avg(h.score_hqi)::numeric, 3) as avg_hqi,
  sum(coalesce(h.ta_num_reviews, 0)) as total_ta_reviews,
  sum(coalesce(h.gp_user_rating_count, 0)) as total_gp_reviews,
  sum(f.total_reviews) as total_reviews_db,
  sum(f.processed_reviews) as total_processed_reviews,
  round(avg(f.processed_review_coverage)::numeric, 3) as avg_processed_review_coverage,
  round(avg(h.ta_owner_response_rate)::numeric, 2) as avg_response_rate,
  round(avg(h.computed_value_gap)::numeric, 2) as avg_value_gap,
  round(avg(h.computed_language_gap)::numeric, 1) as avg_language_gap,
  round(avg(h.computed_opportunity_score)::numeric, 3) as avg_opportunity_score,
  round(avg(h.ta_segment_pct_couples)::numeric, 2) as avg_segment_couples,
  round(avg(h.ta_segment_pct_family)::numeric, 2) as avg_segment_family,
  round(avg(h.ta_segment_pct_business)::numeric, 2) as avg_segment_business,
  round(avg(h.ta_segment_pct_solo)::numeric, 2) as avg_segment_solo,
  round(avg(h.ta_segment_pct_friends)::numeric, 2) as avg_segment_friends,
  count(*) filter (where h.ta_subrating_weakest = 'value') as hotels_weak_value,
  count(*) filter (where h.ta_subrating_weakest = 'location') as hotels_weak_location,
  count(*) filter (where h.ta_subrating_weakest = 'rooms') as hotels_weak_rooms,
  count(*) filter (where f.proof_path_state = 'deep') as deep_proof_hotels,
  count(*) filter (where f.direct_rate_position = 'direct_cheaper') as direct_rate_advantage_hotels,
  count(*) filter (where f.unserved_language_count > 0) as hotels_with_unserved_languages,
  count(*) filter (where f.unserved_language_count >= 3) as hotels_with_large_language_gap,
  count(*) filter (where h.cx_gm_name is not null or h.cx_gm_email is not null or h.cx_gm_phone is not null) as hotels_with_contact_intel,
  count(*) filter (where h.ai_visibility_score is not null) as hotels_with_ai_visibility,
  count(distinct h.country) as country_count,
  count(distinct h.city) as city_count
from public.hotels h
join public.v_hotel_signal_facts f on f.hotel_id = h.id
where h.enrichment_status is not null
group by coalesce(h.ta_parent_brand, h.ta_brand, 'Independent');

comment on view public.v_chain_intelligence is 'Chain / brand rollup enriched with proof depth, language mismatch, direct rate posture, and contact coverage.';

create or replace view public.v_hotel_opportunities as
select
  h.id as hotel_id,
  h.name,
  h.city,
  h.country,
  h.ta_rating,
  h.score_hqi,
  h.computed_opportunity_score,
  h.computed_opportunity_primary,
  h.computed_opportunity_narrative,
  h.computed_language_gap,
  h.computed_value_gap,
  h.ta_owner_response_rate,
  h.ta_review_language_count,
  h.computed_effective_website_langs,
  f.total_reviews,
  f.processed_reviews,
  f.processed_review_coverage,
  f.proof_path_state,
  f.top_unserved_language,
  f.top_unserved_language_name,
  f.top_unserved_language_reviews,
  f.top_unserved_language_rating,
  f.direct_rate_delta,
  f.direct_rate_position,
  f.distinct_quote_count,
  f.dominant_seed_emotion,
  f.compset_rating_delta,
  f.top_competitor_name,
  f.top_competitor_rating,
  case
    when f.proof_path_state = 'thin' then
      'Complete review ingestion and source linking before using this hotel as a proof-heavy outbound brief.'
    when h.computed_opportunity_primary = 'language_gap' and f.top_unserved_language_name is not null then
      'Launch ' || f.top_unserved_language_name || ' landing pages and reuse existing guest proof in outreach.'
    when h.computed_opportunity_primary = 'value_gap' then
      'Reposition value with inclusion-led rate pages, package messaging, and proof-rich review snippets.'
    when h.computed_opportunity_primary = 'competitive_position' then
      'Target the weakest experience theme, then publish proof that closes the local comp-set gap.'
    when h.computed_opportunity_primary = 'response_rate' then
      'Automate multilingual response workflows around the small set of reputation risks still going unanswered.'
    when f.direct_rate_position = 'direct_cheaper' then
      'Lean into direct-booking pages and paid landing pages because the hotel already wins on price.'
    else
      'Use the strongest review proof and local market gap as the outreach wedge.'
  end as opportunity_action,
  case
    when f.proof_path_state = 'thin' then
      'Evidence trail is thin. Treat this as a data-completion target before using it as a showcase brief.'
    when h.computed_opportunity_primary = 'language_gap' and f.top_unserved_language_name is not null then
      f.top_unserved_language_name || ' is the largest uncovered review market with ' || coalesce(f.top_unserved_language_reviews, 0) || ' reviews.'
    when h.computed_opportunity_primary = 'value_gap' and h.computed_value_gap is not null then
      'Guests rate value ' || round(h.computed_value_gap::numeric, 1) || ' points below service.'
    when h.computed_opportunity_primary = 'competitive_position' and f.top_competitor_name is not null and f.top_competitor_rating is not null then
      f.top_competitor_name || ' leads at ' || round(f.top_competitor_rating::numeric, 1) || ' in the mapped set.'
    when f.direct_rate_position = 'direct_cheaper' and f.direct_rate_delta is not null then
      'Direct undercuts OTAs by ' || abs(round(f.direct_rate_delta::numeric, 0)) || ' on the latest rate check.'
    else
      coalesce(h.computed_opportunity_narrative, 'Use the mapped review corpus to turn weak guest signals into a commercial pitch.')
  end as sales_hook
from public.hotels h
join public.v_hotel_signal_facts f on f.hotel_id = h.id
where h.enrichment_status is not null
  and h.computed_opportunity_score is not null
order by h.computed_opportunity_score desc;

comment on view public.v_hotel_opportunities is 'Hotels ranked for sales prioritization with an action sentence, proof state, and the commercial wedge behind the score.';

create or replace function public.get_hotel_intelligence(target_hotel_id uuid)
returns jsonb
language sql
stable
as $$
  with hotel_base as (
    select *
    from public.hotels
    where id = target_hotel_id
  ),
  facts as (
    select *
    from public.v_hotel_signal_facts
    where hotel_id = target_hotel_id
  ),
  opp as (
    select *
    from public.v_hotel_opportunities
    where hotel_id = target_hotel_id
  ),
  review_velocity as (
    select
      coalesce(sum(review_count) filter (
        where month >= (date_trunc('month', current_date) - interval '3 months')::date
      ), 0) as last_3_months
    from public.mv_review_timeline
    where hotel_id = target_hotel_id
  ),
  guest_signal as (
    select jsonb_build_object(
      'dominant_spending_level', f.dominant_spending_level,
      'dominant_length_of_stay', f.dominant_length_of_stay,
      'repeat_guest_pct', f.repeat_guest_pct
    ) as payload
    from facts f
  ),
  pricing_signal as (
    select jsonb_build_object(
      'latest_check_date', f.latest_price_check_date,
      'direct_rate_delta', f.direct_rate_delta,
      'position', f.direct_rate_position,
      'narrative',
      case
        when f.direct_rate_position = 'direct_cheaper' and f.direct_rate_delta is not null then
          'Direct currently beats the cheapest OTA by ' || abs(round(f.direct_rate_delta::numeric, 0)) || '. This is a conversion asset, not just a pricing fact.'
        when f.direct_rate_position = 'ota_cheaper' and f.direct_rate_delta is not null then
          'OTAs undercut direct by ' || abs(round(f.direct_rate_delta::numeric, 0)) || '. This weakens the direct-booking story.'
        when f.direct_rate_position = 'parity' then
          'Direct and OTA pricing are effectively at parity on the latest check.'
        else
          'Pricing coverage is still thin for this property.'
      end
    ) as payload
    from facts f
  ),
  content_signal as (
    select jsonb_build_object(
      'distinct_quote_count', f.distinct_quote_count,
      'seed_review_count', f.seed_review_count,
      'dominant_emotion', f.dominant_seed_emotion,
      'narrative',
      case
        when f.distinct_quote_count >= 100 then
          f.distinct_quote_count || ' distinct guest quotes are already available for landing pages, ads, and outreach.'
        when f.distinct_quote_count > 0 then
          f.distinct_quote_count || ' distinct guest quotes are already available, but the content library is still thin.'
        else
          'No distinct guest-quote library has been materialized yet for this property.'
      end
    ) as payload
    from facts f
  ),
  competitive_signal as (
    select jsonb_build_object(
      'delta_vs_compset', f.compset_rating_delta,
      'top_competitor_name', f.top_competitor_name,
      'top_competitor_rating', f.top_competitor_rating,
      'narrative',
      case
        when f.compset_rating_delta is null then
          'Competitive context is mapped, but rating delta is still sparse.'
        when f.compset_rating_delta < -0.2 and f.top_competitor_name is not null and f.top_competitor_rating is not null then
          f.top_competitor_name || ' leads the visible set at ' || round(f.top_competitor_rating::numeric, 1) || ', leaving this hotel ' || abs(round(f.compset_rating_delta::numeric, 1)) || ' points behind the comp-set average.'
        when f.compset_rating_delta >= 0.2 then
          'This hotel already beats the comp-set average on rating. Use that lead as proof, not urgency.'
        else
          'This hotel sits close to the local comp-set average. Operational details will decide the pitch.'
      end
    ) as payload
    from facts f
  ),
  evidence_summary as (
    select jsonb_build_object(
      'total_reviews', f.total_reviews,
      'processed_reviews', f.processed_reviews,
      'processed_review_coverage', f.processed_review_coverage,
      'google_reviews', f.google_reviews,
      'tripadvisor_reviews', f.tripadvisor_reviews,
      'proof_path_state', f.proof_path_state
    ) as payload
    from facts f
  )
  select jsonb_build_object(
    'opportunity', (
      select jsonb_build_object(
        'score', o.computed_opportunity_score,
        'primary_reason', o.computed_opportunity_primary,
        'narrative', o.computed_opportunity_narrative,
        'action', o.opportunity_action,
        'sales_hook', o.sales_hook,
        'proof_path_state', o.proof_path_state
      )
      from opp o
    ),
    'evidence_summary', (select payload from evidence_summary),
    'guest_signal', (select payload from guest_signal),
    'pricing_signal', (select payload from pricing_signal),
    'content_readiness', (select payload from content_signal),
    'competitive_signal', (select payload from competitive_signal),
    'language_markets', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'lang', lb.lang,
        'lang_name', public.language_display_name(lb.lang),
        'review_count', lb.review_count,
        'avg_rating', lb.avg_rating,
        'served', public.website_serves_language((select dp_website_content_languages from hotel_base), lb.lang)
      ) order by lb.review_count desc), '[]'::jsonb)
      from public.mv_lang_breakdown lb
      where lb.hotel_id = target_hotel_id
    ),
    'topic_strengths', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'aspect', t.aspect,
        'mentions', t.mention_count,
        'positive_pct', t.positive_pct
      ) order by t.positive_pct desc, t.mention_count desc), '[]'::jsonb)
      from (
        select *
        from public.mv_hotel_topics t
        where t.hotel_id = target_hotel_id
          and t.mention_count >= 10
          and t.positive_pct >= 80
        order by t.positive_pct desc, t.mention_count desc
        limit 5
      ) t
    ),
    'topic_weaknesses', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'aspect', t.aspect,
        'mentions', t.mention_count,
        'negative_pct', t.negative_pct
      ) order by t.negative_pct desc, t.mention_count desc), '[]'::jsonb)
      from (
        select *
        from public.mv_hotel_topics t
        where t.hotel_id = target_hotel_id
          and t.mention_count >= 5
          and t.negative_pct >= 15
        order by t.negative_pct desc, t.mention_count desc
        limit 5
      ) t
    ),
    'review_velocity', (
      select row_to_json(rv)
      from review_velocity rv
    )
  );
$$;

comment on function public.get_hotel_intelligence(uuid) is 'Returns the commercial hotel briefing payload: opportunity, proof depth, language mismatch, pricing posture, content readiness, and competitive pressure.';
