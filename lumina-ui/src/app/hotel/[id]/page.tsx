import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AIVisibility } from '@/components/AIVisibility';
import { AmenitiesGrid } from '@/components/AmenitiesGrid';
import { CompetitorTable } from '@/components/CompetitorTable';
import { ContactIntel } from '@/components/ContactIntel';
import { ContentSeedsList } from '@/components/ContentSeedsList';
import { GuestSegmentPie } from '@/components/GuestSegmentPie';
import { LanguageBreakdown } from '@/components/LanguageBreakdown';
import { PriceIntelligence } from '@/components/PriceIntelligence';
import { QualityRadar } from '@/components/QualityRadar';
import { ReviewTimeline } from '@/components/ReviewTimeline';
import { SentimentByTopic } from '@/components/SentimentByTopic';
import { getHotelCard } from '@/lib/data';
import {
  getAiVisibilityInsight,
  getCompetitiveInsight,
  getContactInsight,
  getContentSeedInsight,
  getDigitalOperationalInsight,
  getLanguageInsight,
  getPersonaLabel,
  getPricingInsight,
  getQualityInsight,
  getTopicInsight,
  getWhoStaysInsight,
} from '@/lib/insights';
import type { HotelDashboardRow } from '@/lib/types';
import { formatDecimal, formatNumber, titleCase } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <h2 className="font-serif text-2xl text-[var(--lumina-ink)]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function segmentSummary(hotel: HotelDashboardRow): string[] {
  return [
    { label: 'Family', value: hotel.ta_segment_pct_family },
    { label: 'Couples', value: hotel.ta_segment_pct_couples },
    { label: 'Business', value: hotel.ta_segment_pct_business },
    { label: 'Friends', value: hotel.ta_segment_pct_friends },
    { label: 'Solo', value: hotel.ta_segment_pct_solo },
  ]
    .filter((item): item is { label: string; value: number } => typeof item.value === 'number' && item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map(item => `${item.label} ${Math.round(item.value * 100)}%`);
}

function operationalSnapshot(hotel: HotelDashboardRow) {
  const certification = [
    hotel.cert_gstc ? 'GSTC' : null,
    hotel.cert_green_key ? 'Green Key' : null,
    hotel.cert_earthcheck ? `EarthCheck${hotel.cert_earthcheck_level ? ` ${hotel.cert_earthcheck_level}` : ''}` : null,
    hotel.cert_swisstainable ? `Swisstainable ${hotel.cert_swisstainable}` : null,
  ].filter(Boolean);

  return [
    { label: 'Website', value: hotel.website_url?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? 'Unavailable' },
    { label: 'CMS', value: titleCase(hotel.dp_website_tech_cms) },
    { label: 'Booking', value: titleCase(hotel.dp_website_tech_booking) },
    { label: 'Domain authority', value: formatNumber(hotel.seo_domain_authority) },
    { label: 'Schema.org', value: hotel.dp_schema_completeness != null ? `${Math.round(hotel.dp_schema_completeness * 100)}%` : '—' },
    { label: 'Google Business', value: hotel.gmb_is_claimed == null ? 'Unknown' : hotel.gmb_is_claimed ? 'Claimed' : 'Unclaimed' },
    { label: 'Google Ads', value: hotel.seo_has_google_ads ? 'Active' : 'Not detected' },
    { label: 'Amenities', value: formatNumber(hotel.ta_amenity_count) },
    { label: 'Social', value: hotel.dp_instagram_exists ? `Instagram @${hotel.dp_instagram_handle ?? 'active'}` : 'No active signal' },
    { label: 'Hiring', value: hotel.cx_active_job_count ? `${formatNumber(hotel.cx_active_job_count)} open roles` : 'No active roles' },
    { label: 'Certifications', value: certification.length ? certification.join(' · ') : 'None captured' },
  ].filter(item => !['—', 'Unavailable', 'Unknown', 'No active signal', 'No active roles', 'None captured'].includes(item.value));
}

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getHotelCard(id);
  const hotel = data.hotel;

  if (!hotel) notFound();

  const segmentFacts = segmentSummary(hotel);
  const heroFacts = [
    hotel.ta_num_reviews != null ? `${formatNumber(hotel.ta_num_reviews)} TA reviews` : null,
    hotel.gp_user_rating_count != null ? `${formatNumber(hotel.gp_user_rating_count)} Google reviews` : null,
    hotel.ta_ranking != null && hotel.ta_ranking_out_of != null
      ? `#${formatNumber(hotel.ta_ranking)} of ${formatNumber(hotel.ta_ranking_out_of)} in ${hotel.ta_ranking_geo ?? hotel.city ?? 'market'}`
      : null,
    hotel.ta_review_language_count != null ? `${formatNumber(hotel.ta_review_language_count)} languages` : null,
  ].filter(Boolean);

  const hasAiSignal =
    hotel.ai_visibility_score != null ||
    hotel.ai_chatgpt_mentioned != null ||
    hotel.ai_perplexity_mentioned != null ||
    Boolean(hotel.gp_review_summary_gemini) ||
    Boolean(hotel.gp_editorial_summary);
  const hasQualitySignal = [
    hotel.ta_subrating_location,
    hotel.ta_subrating_sleep,
    hotel.ta_subrating_rooms,
    hotel.ta_subrating_service,
    hotel.ta_subrating_value,
    hotel.ta_subrating_cleanliness,
  ].some(value => value != null);
  const hasGuestSegmentSignal = segmentFacts.length > 0;
  const hasPersonaSignal = data.personaDeepDive.totalSignalReviews > 0 || data.personas.length > 0;
  const hasTopicSignal = data.topics.some(topic => topic.mention_count > 0);
  const hasCompetitorSignal = data.competitors.some(competitor =>
    competitor.competitor_name &&
    [
      competitor.competitor_rating,
      competitor.competitor_reviews,
      competitor.competitor_service_score,
      competitor.competitor_value_score,
      competitor.competitor_hqi,
    ].some(value => value != null),
  );
  const hasTimelineSignal = data.timeline.length > 0 || data.metricSnapshots.length > 0 || data.changes.length > 0;
  const hasLanguageSignal = data.languages.some(language => language.review_count > 0);
  const hasPriceSignal =
    data.priceSnapshots.length > 0 ||
    hotel.price_booking_com != null ||
    hotel.price_expedia != null ||
    hotel.price_hotels_com != null ||
    hotel.price_direct != null ||
    hotel.price_lowest_ota != null ||
    hotel.price_parity_score != null;
  const hasOperationalSignal =
    data.amenities.length > 0 ||
    hotel.ta_amenity_count != null ||
    hotel.dp_website_tech_cms != null ||
    hotel.dp_website_tech_booking != null ||
    hotel.dp_website_tech_analytics != null ||
    hotel.dp_has_schema_hotel != null ||
    hotel.dp_schema_completeness != null ||
    hotel.seo_domain_authority != null ||
    hotel.seo_monthly_traffic_est != null ||
    hotel.seo_organic_keywords != null ||
    hotel.seo_has_google_ads != null ||
    hotel.dp_instagram_exists != null ||
    hotel.dp_has_active_social != null ||
    hotel.gmb_is_claimed != null ||
    hotel.gmb_book_online_url != null ||
    hotel.gmb_hotel_star_rating != null ||
    hotel.gov_star_rating != null ||
    hotel.qna_response_rate != null ||
    hotel.cert_gstc === true ||
    hotel.cert_green_key === true ||
    hotel.cert_earthcheck === true ||
    hotel.cert_swisstainable != null;
  const hasContentSignal = data.content_seeds.length > 0;
  const hasContactSignal =
    hotel.cx_gm_name != null ||
    hotel.cx_gm_email != null ||
    hotel.cx_gm_phone != null ||
    hotel.cx_gm_linkedin != null ||
    hotel.cx_gm_source != null ||
    (hotel.cx_active_job_count ?? 0) > 0 ||
    Boolean(hotel.cx_hiring_departments);

  const stayInsight = getWhoStaysInsight(hotel, data.personas, data.personaDeepDive);
  const primaryLengthOfStay = data.personaDeepDive.lengthsOfStay[0]?.label
    ? titleCase(data.personaDeepDive.lengthsOfStay[0].label)
    : null;
  const compareTarget = data.competitors.find(competitor => competitor.competitor_id)?.competitor_id;
  const compareHref = compareTarget ? `/compare?ids=${hotel.hotel_id},${compareTarget}` : `/compare?ids=${hotel.hotel_id}`;
  const operationalItems = operationalSnapshot(hotel);
  const personaCards = data.personas.filter(persona => Boolean(getPersonaLabel(persona))).slice(0, 3);
  const hasRepeatGuestCard = data.personaDeepDive.totalSignalReviews > 0;
  const hasTypicalStayCard = Boolean(primaryLengthOfStay);
  const hasStayDetailColumn = personaCards.length > 0 || hasRepeatGuestCard || hasTypicalStayCard;

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {[hotel.city, hotel.country, hotel.ta_brand].filter(Boolean).join(' · ')}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--lumina-ink)]">{hotel.name}</h1>
            {hotel.gp_editorial_summary ? (
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-700">{hotel.gp_editorial_summary}</p>
            ) : null}
            {heroFacts.length ? (
              <p className="mt-4 text-sm leading-6 text-stone-600">{heroFacts.join(' · ')}</p>
            ) : null}
            {segmentFacts.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {segmentFacts.map(item => (
                  <span key={item} className="rounded-full bg-[var(--warm-cream)] px-3 py-1 text-sm text-[var(--deep-terracotta)]">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-3xl bg-[var(--warm-cream)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">TripAdvisor</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.ta_rating, 1)}</p>
            </div>
            <div className="rounded-3xl bg-[var(--warm-cream)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Google</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.gp_rating, 1)}</p>
            </div>
            <div className="rounded-3xl bg-[var(--warm-cream)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Quality</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">
                {hotel.score_hqi != null ? `${Math.round(hotel.score_hqi * 100)}/100` : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href={compareHref} className="rounded-full bg-[var(--deep-terracotta)] px-4 py-2 font-medium text-white hover:bg-[var(--lumina-ink)]">
            Compare
          </Link>
          <Link href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300">
            Back to portfolio
          </Link>
        </div>
      </section>

      {hasQualitySignal ? (
        <Section title="Quality Profile">
          <QualityRadar hotel={hotel} insight={getQualityInsight(hotel)} />
        </Section>
      ) : null}

      {(hasGuestSegmentSignal || hasPersonaSignal) ? (
        <Section title="Who Stays Here">
          <div className="space-y-5">
            <p className="text-sm leading-6 text-stone-700">{stayInsight}</p>
            <div className={`grid gap-5 ${hasGuestSegmentSignal && hasStayDetailColumn ? 'xl:grid-cols-[0.85fr_1.15fr]' : 'xl:grid-cols-1'}`}>
              {hasGuestSegmentSignal ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-5">
                  <GuestSegmentPie hotel={hotel} />
                </div>
              ) : null}

              {hasStayDetailColumn ? (
              <div className="space-y-4">
                {personaCards.length ? (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Top personas</p>
                    <div className="mt-4 space-y-3">
                      {personaCards.map(persona => (
                        <div key={`${persona.occasion}-${persona.spending_level}-${persona.group_detail}`} className="rounded-2xl bg-[var(--warm-cream)] p-4">
                          <p className="text-sm font-semibold text-[var(--lumina-ink)]">
                            {getPersonaLabel(persona)}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {formatNumber(persona.review_count)} reviews · avg rating {formatDecimal(persona.avg_rating, 1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(hasRepeatGuestCard || hasTypicalStayCard) ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {hasRepeatGuestCard ? (
                      <div className="rounded-3xl border border-stone-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Repeat guests</p>
                        <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">
                          {data.personaDeepDive.repeatGuestPct != null ? `${Math.round(data.personaDeepDive.repeatGuestPct * 100)}%` : '—'}
                        </p>
                        <p className="mt-2 text-sm text-stone-600">
                          {formatNumber(data.personaDeepDive.repeatGuestReviews)} repeat-guest reviews from {formatNumber(data.personaDeepDive.totalSignalReviews)} persona signals.
                        </p>
                      </div>
                    ) : null}
                    {hasTypicalStayCard ? (
                      <div className="rounded-3xl border border-stone-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Typical stay</p>
                        <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{primaryLengthOfStay}</p>
                        <p className="mt-2 text-sm text-stone-600">Based on the strongest length-of-stay signal in the review corpus.</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {hasCompetitorSignal ? (
        <Section title="Competitive Landscape">
          <CompetitorTable
            competitors={data.competitors}
            targetHotelId={hotel.hotel_id}
            hotel={hotel}
            insight={getCompetitiveInsight(hotel, data.competitors)}
          />
        </Section>
      ) : null}

      {hasTopicSignal ? (
        <Section title="What Guests Say">
          <SentimentByTopic topics={data.topics} insight={getTopicInsight(data.topics)} />
        </Section>
      ) : null}

      {hasLanguageSignal ? (
        <Section title="Language Opportunity">
          <LanguageBreakdown
            languages={data.languages}
            websiteContentLanguages={hotel.dp_website_content_languages}
            insight={getLanguageInsight(hotel, data.languages)}
          />
        </Section>
      ) : null}

      {hasAiSignal ? (
        <Section title="How AI Sees This Hotel">
          <AIVisibility hotel={hotel} competitorAverage={data.aiCompetitorAverage} insight={getAiVisibilityInsight(hotel, data.aiCompetitorAverage)} />
        </Section>
      ) : null}

      {hasTimelineSignal ? (
        <Section title="Review Momentum">
          <ReviewTimeline data={data.timeline} metricSnapshots={data.metricSnapshots} changes={data.changes} />
        </Section>
      ) : null}

      {hasPriceSignal ? (
        <Section title="Pricing & Distribution">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-stone-700">{getPricingInsight(hotel, data.priceSnapshots)}</p>
            <PriceIntelligence hotel={hotel} snapshots={data.priceSnapshots} />
          </div>
        </Section>
      ) : null}

      {hasOperationalSignal ? (
        <Section title="Digital & Operational">
          <div className="space-y-5">
            <p className="text-sm leading-6 text-stone-700">{getDigitalOperationalInsight(hotel, data.amenities)}</p>
            {operationalItems.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {operationalItems.map(item => (
                  <div key={item.label} className="rounded-3xl border border-stone-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--lumina-ink)]">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <AmenitiesGrid hotel={hotel} amenities={data.amenities} />
          </div>
        </Section>
      ) : null}

      {hasContentSignal ? (
        <Section title="Ready-to-Use Guest Quotes">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-stone-700">{getContentSeedInsight(data.content_seeds)}</p>
            <ContentSeedsList seeds={data.content_seeds} />
          </div>
        </Section>
      ) : null}

      {hasContactSignal ? (
        <Section title="Who to Contact">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-stone-700">{getContactInsight(hotel)}</p>
            <ContactIntel hotel={hotel} />
          </div>
        </Section>
      ) : null}
    </main>
  );
}
