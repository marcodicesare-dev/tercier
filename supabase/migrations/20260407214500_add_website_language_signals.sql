alter table public.hotels
  add column if not exists dp_website_primary_language text,
  add column if not exists dp_website_content_languages text,
  add column if not exists dp_website_language_count int;

comment on column public.hotels.dp_website_primary_language is 'Primary language detected on the hotel website from Firecrawl/DataForSEO metadata.';
comment on column public.hotels.dp_website_content_languages is 'Pipe-separated website language or locale codes detected from metadata and html signals.';
comment on column public.hotels.dp_website_language_count is 'Count of distinct website language or locale codes detected on the property website.';
