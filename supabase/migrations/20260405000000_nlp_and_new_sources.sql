-- NLP pipeline + new DataForSEO source layer
-- Additive only. Extends deep intelligence with Q&A, GMB signals, and richer review NLP payloads.

alter table public.hotel_reviews
  add column if not exists guest_persona jsonb,
  add column if not exists content_seeds jsonb,
  add column if not exists competitor_mentions jsonb;

create table if not exists public.hotel_qna (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  source text not null default 'google',
  source_question_id text not null,
  question text not null,
  question_author text,
  question_author_url text,
  question_date timestamptz,
  answers jsonb,
  answer_count int not null default 0,
  has_answer boolean not null default false,
  has_official_answer boolean not null default false,
  latest_answer text,
  latest_answered_by text,
  latest_answer_date timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(hotel_id, source, source_question_id)
);

create index if not exists idx_hotel_qna_hotel on public.hotel_qna(hotel_id);
create index if not exists idx_hotel_qna_latest_answer on public.hotel_qna(hotel_id, latest_answer_date desc);

alter table public.hotels
  add column if not exists qna_count int,
  add column if not exists qna_unanswered_count int,
  add column if not exists qna_response_rate real,
  add column if not exists gmb_is_claimed boolean,
  add column if not exists gmb_popular_times jsonb,
  add column if not exists gmb_place_topics jsonb,
  add column if not exists gmb_hotel_star_rating real,
  add column if not exists gmb_book_online_url text,
  add column if not exists gmb_people_also_search jsonb,
  add column if not exists gov_star_rating real,
  add column if not exists gov_star_source text,
  add column if not exists ai_visibility_score real,
  add column if not exists ai_chatgpt_mentioned boolean,
  add column if not exists ai_perplexity_mentioned boolean,
  add column if not exists dp_has_schema_hotel boolean,
  add column if not exists dp_schema_completeness real,
  add column if not exists cert_earthcheck boolean,
  add column if not exists cert_earthcheck_level text,
  add column if not exists bk_rating real,
  add column if not exists bk_num_reviews int,
  add column if not exists bk_star_rating real,
  add column if not exists rating_divergence_ta_vs_bk real,
  add column if not exists cx_active_job_count int,
  add column if not exists cx_hiring_departments text;

comment on table public.hotel_qna is 'Guest questions and answers from Google. Stores the full question plus the full answer array so AI can mine pre-booking intent and unanswered demand.';
comment on column public.hotel_reviews.guest_persona is 'JSONB persona extracted from review text: occasion, length of stay, spending level, repeat-guest signals, and group composition.';
comment on column public.hotel_reviews.content_seeds is 'JSONB array of emotionally resonant review snippets suitable for testimonials, hero copy, or social proof.';
comment on column public.hotel_reviews.competitor_mentions is 'JSONB array of competitor references extracted from review text, including comparison direction and source quote.';
comment on column public.hotels.qna_count is 'Number of Google Q&A threads found for the hotel.';
comment on column public.hotels.qna_unanswered_count is 'Count of Q&A threads with no answers.';
comment on column public.hotels.qna_response_rate is 'Answered Q&A threads divided by total Q&A threads.';
comment on column public.hotels.gmb_is_claimed is 'Whether the Google Business profile appears to be claimed by the hotel.';
comment on column public.hotels.gmb_popular_times is 'JSONB popular-times / busyness data from Google My Business when available.';
comment on column public.hotels.gmb_place_topics is 'JSONB topic summary surfaced by Google My Business, useful as a cheap precomputed topic layer.';
comment on column public.hotels.gmb_hotel_star_rating is 'Hotel star rating surfaced by Google My Business / hotel modules when available.';
comment on column public.hotels.gmb_book_online_url is 'Google surfaced book-online URL from the business profile.';
comment on column public.hotels.gmb_people_also_search is 'JSONB nearby entities Google says users also search for.';
comment on column public.hotels.gov_star_rating is 'Official government or tourism-board star classification when sourced.';
comment on column public.hotels.gov_star_source is 'Source system for government star rating (e.g. Hotelstars, HotelGrade).';
comment on column public.hotels.ai_visibility_score is 'Placeholder aggregate score for future AI discovery audits across LLMs.';
comment on column public.hotels.ai_chatgpt_mentioned is 'Placeholder for whether the hotel is surfaced in ChatGPT discovery checks.';
comment on column public.hotels.ai_perplexity_mentioned is 'Placeholder for whether the hotel is surfaced in Perplexity discovery checks.';
comment on column public.hotels.dp_has_schema_hotel is 'Whether the hotel website exposes Hotel/HotelRoom Schema.org markup.';
comment on column public.hotels.dp_schema_completeness is '0-1 completeness score for hotel-related structured data markup on the website.';
comment on column public.hotels.cert_earthcheck is 'Whether the property appears certified by EarthCheck.';
comment on column public.hotels.cert_earthcheck_level is 'EarthCheck certification level when available.';
comment on column public.hotels.bk_rating is 'Placeholder Booking.com rating for future cross-platform comparison.';
comment on column public.hotels.bk_num_reviews is 'Placeholder Booking.com review count for future cross-platform comparison.';
comment on column public.hotels.bk_star_rating is 'Placeholder Booking.com / OTA star rating field for future parity analysis.';
comment on column public.hotels.rating_divergence_ta_vs_bk is 'TripAdvisor rating minus Booking.com rating.';
comment on column public.hotels.cx_active_job_count is 'Count of currently active hiring signals for the hotel or operating entity.';
comment on column public.hotels.cx_hiring_departments is 'Pipe-separated hiring departments inferred from active job listings.';
