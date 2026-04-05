import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompetitorTable } from '@/components/CompetitorTable';
import { ContentSeedsList } from '@/components/ContentSeedsList';
import { GuestSegmentPie } from '@/components/GuestSegmentPie';
import { buildKeyMetrics, KeyMetrics } from '@/components/KeyMetrics';
import { LanguageBreakdown } from '@/components/LanguageBreakdown';
import { QnAList } from '@/components/QnAList';
import { QualityRadar } from '@/components/QualityRadar';
import { ReviewTimeline } from '@/components/ReviewTimeline';
import { ScoreGauges } from '@/components/ScoreGauges';
import { SentimentByTopic } from '@/components/SentimentByTopic';
import { getHotelCard } from '@/lib/data';
import { formatDecimal, formatNumber, formatPercent, titleCase } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
      <h3 className="mt-2 font-serif text-2xl text-[var(--lumina-ink)]">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getHotelCard(id);
  const hotel = data.hotel;

  if (!hotel) notFound();

  const metrics = buildKeyMetrics({
    responseRate: hotel.ta_owner_response_rate,
    reviews90d: hotel.ta_reviews_last_90d_est,
    amenityCount: hotel.ta_amenity_count,
    qnaCount: hotel.qna_count,
    domainAuthority: hotel.seo_domain_authority,
    priceLevel: hotel.ta_price_level,
    cms: hotel.dp_website_tech_cms,
    bookingTech: hotel.dp_website_tech_booking,
  });

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {[hotel.city, hotel.country, hotel.ta_brand ?? null].filter(Boolean).join(' · ')}
            </p>
            <h2 className="mt-2 font-serif text-4xl text-[var(--lumina-ink)]">{hotel.name}</h2>
            {hotel.gp_editorial_summary ? (
              <p className="mt-3 max-w-3xl text-base italic leading-7 text-stone-600">{hotel.gp_editorial_summary}</p>
            ) : null}
            <p className="mt-4 text-sm leading-6 text-stone-600">
              {formatNumber(hotel.ta_num_reviews)} TripAdvisor · {formatNumber(hotel.gp_user_rating_count)} Google ·{' '}
              {formatNumber(hotel.ta_review_language_count)} languages · #{formatNumber(hotel.ta_ranking)} of{' '}
              {formatNumber(hotel.ta_ranking_out_of)} in {hotel.ta_ranking_geo ?? hotel.city}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-[var(--warm-cream)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">TripAdvisor</p>
              <p className="mt-2 text-4xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.ta_rating, 1)}</p>
            </div>
            <div className="rounded-3xl bg-[var(--warm-cream)] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Google</p>
              <p className="mt-2 text-4xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.gp_rating, 1)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-[#efe4d8] px-4 py-2 text-[var(--deep-terracotta)]">
            Primary segment: {titleCase(hotel.ta_primary_segment)}
          </span>
          <span className="rounded-full bg-stone-100 px-4 py-2 text-stone-700">
            Response rate: {formatPercent(hotel.ta_owner_response_rate, 1)}
          </span>
          <span className="rounded-full bg-stone-100 px-4 py-2 text-stone-700">
            Topics: {formatNumber(hotel.topic_mentions_total)}
          </span>
          <Link href={`/compare?ids=${hotel.hotel_id}`} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300">
            Open comparison →
          </Link>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Section eyebrow="Quality fingerprint" title="Where the property wins and where it leaks">
          <QualityRadar hotel={hotel} />
          <p className="mt-4 text-sm text-stone-600">
            Strongest: <span className="font-medium text-[var(--lumina-ink)]">{titleCase(hotel.ta_subrating_strongest)}</span> · Weakest:{' '}
            <span className="font-medium text-[var(--lumina-ink)]">{titleCase(hotel.ta_subrating_weakest)}</span> · Range:{' '}
            <span className="font-medium text-[var(--lumina-ink)]">{formatDecimal(hotel.ta_subrating_range, 2)}</span>
          </p>
        </Section>
        <Section eyebrow="Guest segments" title="Who the hotel is really serving">
          <GuestSegmentPie hotel={hotel} />
          <p className="mt-4 text-sm text-stone-600">
            Primary segment: <span className="font-medium text-[var(--lumina-ink)]">{titleCase(hotel.ta_primary_segment)}</span> · Diversity:{' '}
            <span className="font-medium text-[var(--lumina-ink)]">{formatDecimal(hotel.ta_segment_diversity, 2)}</span>
          </p>
        </Section>
      </div>

      <Section eyebrow="Decision layer" title="Scores the GM can act on immediately">
        <ScoreGauges
          hqi={hotel.score_hqi}
          tos={hotel.score_tos}
          risk={hotel.score_reputation_risk}
          digital={hotel.score_digital_presence}
        />
      </Section>

      <Section eyebrow="Topic sentiment" title="What guests talk about most, and how they feel">
        <SentimentByTopic topics={data.topics} />
      </Section>

      <Section eyebrow="Timeline" title="Momentum over time">
        <ReviewTimeline data={data.timeline} />
      </Section>

      <Section eyebrow="Competition" title="How the guest experience stacks up nearby">
        <CompetitorTable competitors={data.competitors} targetHotelId={hotel.hotel_id} />
      </Section>

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Section eyebrow="Languages" title="Which markets speak, and rate, differently">
          <LanguageBreakdown languages={data.languages} />
        </Section>
        <Section eyebrow="Key metrics" title="What matters operationally">
          <KeyMetrics metrics={metrics} />
        </Section>
      </div>

      <Section eyebrow="Content engine" title="Quotes already shaped for campaign use">
        <ContentSeedsList seeds={data.content_seeds} />
      </Section>

      <Section eyebrow="Google Q&A" title="Questions guests ask before booking">
        <QnAList questions={data.qna} />
      </Section>
    </main>
  );
}
