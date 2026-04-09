create or replace function public.compute_hotel_opportunity(hotel_id_in uuid)
returns table(score numeric, primary_reason text, narrative text)
language plpgsql
stable
as $$
declare
  h record;
  eff_web_langs int;
  review_lang_count int;
  lang_gap_val int;
  value_gap_val numeric;
  seed_count int;
  lang_signal numeric;
  value_signal numeric;
  orr_signal numeric;
  comp_signal numeric;
  content_signal numeric;
  qna_signal numeric;
  total_score numeric;
  top_reason text;
  top_narrative text;
  best_signal numeric;
begin
  select * into h from public.hotels where id = hotel_id_in;
  if not found then
    return;
  end if;

  eff_web_langs := public.compute_effective_website_langs(h.dp_website_content_languages);
  review_lang_count := coalesce(h.ta_review_language_count, 0);
  lang_gap_val := greatest(review_lang_count - eff_web_langs, 0);
  lang_signal := least(lang_gap_val::numeric / 10.0, 1.0);

  if h.ta_subrating_service is not null and h.ta_subrating_value is not null then
    value_gap_val := h.ta_subrating_service - h.ta_subrating_value;
  else
    value_gap_val := 0;
  end if;
  value_signal := least(greatest(value_gap_val / 0.6, 0), 1.0);

  orr_signal := case
    when h.ta_owner_response_rate is null then 0.0
    when h.ta_owner_response_rate < 0.3 then 1.0
    when h.ta_owner_response_rate < 0.6 then 0.5
    else 0.0
  end;

  comp_signal := case
    when h.ta_compset_avg_rating is not null and h.ta_rating is not null then
      least(greatest((h.ta_compset_avg_rating - h.ta_rating) / 0.5, 0), 1.0)
    else 0.0
  end;

  select count(*) into seed_count
  from public.mv_content_seeds
  where mv_content_seeds.hotel_id = hotel_id_in;

  content_signal := case
    when seed_count = 0 then 0.8
    when seed_count < 10 then 0.5
    when seed_count < 30 then 0.2
    else 0.0
  end;

  qna_signal := case
    when h.qna_count is not null and h.qna_unanswered_count is not null and h.qna_count > 0 then
      least(h.qna_unanswered_count::numeric / h.qna_count, 1.0)
    else 0.0
  end;

  total_score := (
    lang_signal * 0.25 +
    value_signal * 0.20 +
    orr_signal * 0.05 +
    comp_signal * 0.15 +
    content_signal * 0.10 +
    qna_signal * 0.05
  );
  total_score := least(total_score / 0.80, 1.0);

  best_signal := 0;
  top_reason := 'general';
  if lang_signal > best_signal then best_signal := lang_signal; top_reason := 'language_gap'; end if;
  if value_signal > best_signal then best_signal := value_signal; top_reason := 'value_gap'; end if;
  if orr_signal > best_signal then best_signal := orr_signal; top_reason := 'response_rate'; end if;
  if comp_signal > best_signal then best_signal := comp_signal; top_reason := 'competitive_position'; end if;
  if content_signal > best_signal then best_signal := content_signal; top_reason := 'content_gap'; end if;

  top_narrative := case top_reason
    when 'language_gap' then
      'Guests review in ' || review_lang_count || ' languages but the website serves ' || eff_web_langs || '. ' ||
      lang_gap_val || ' language markets are underserved.'
    when 'value_gap' then
      'Guests rate value ' || round(value_gap_val::numeric, 1) || ' points below service — a pricing perception gap that content can address.'
    when 'response_rate' then
      'Only ' || round((h.ta_owner_response_rate * 100)::numeric) || '% of reviews get a response, leaving reputation risk on the table.'
    when 'competitive_position' then
      'Rating sits ' || round(abs(h.ta_rating - h.ta_compset_avg_rating)::numeric, 1) || ' points below the competitive set average.'
    when 'content_gap' then
      'The marketing content library is thin — only ' || seed_count || ' ready-to-use guest quotes extracted so far.'
    else
      review_lang_count || ' review languages and ' || coalesce(h.ta_num_reviews, 0) || ' reviews mapped.'
  end;

  return query
  select round(total_score, 3), top_reason, top_narrative;
end;
$$;

comment on function public.compute_hotel_opportunity(uuid) is 'Computes sales opportunity score (0-1), primary reason, and narrative for a single hotel. Missing owner-response data no longer pretends to be 0%.';
