'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow, HotelPriceSnapshotRow } from '@/lib/types';
import { formatDecimal } from '@/lib/utils';
import { CHART_THEME } from '@/lib/chart-theme';

function formatMoney(value: number | null | undefined, currency = 'USD') {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PriceIntelligence({
  hotel,
  snapshots,
}: {
  hotel: HotelDashboardRow;
  snapshots: HotelPriceSnapshotRow[];
}) {
  const latest = snapshots.at(-1);
  const barData = [
    { channel: 'Booking', value: latest?.price_booking_com ?? hotel.price_booking_com ?? null },
    { channel: 'Expedia', value: latest?.price_expedia ?? hotel.price_expedia ?? null },
    { channel: 'Hotels.com', value: latest?.price_hotels_com ?? hotel.price_hotels_com ?? null },
    { channel: 'Agoda', value: latest?.price_agoda ?? null },
    { channel: 'Direct', value: latest?.price_direct ?? hotel.price_direct ?? null },
  ].filter(row => row.value != null);

  const trendData = snapshots.map(snapshot => ({
    label: new Date(snapshot.check_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    direct: snapshot.price_direct,
    lowestOta: snapshot.price_lowest_ota,
  }));

  if (!barData.length && !trendData.length && hotel.price_parity_score == null && hotel.price_direct == null && hotel.price_lowest_ota == null) {
    return (
      <EmptyInsight
        title="No OTA pricing yet"
        body="Pricing snapshots have not been captured yet, so there is no parity or channel comparison to show."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Latest nightly pricing</p>
          {barData.length ? (
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis dataKey="channel" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
                  <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatMoney(value, latest?.currency ?? 'USD')} />
                  <Bar dataKey="value" fill={CHART_THEME.terracotta} radius={[8, 8, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-500">No OTA pricing captured yet.</p>
          )}
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Parity posture</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Parity score</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(latest?.price_parity_score ?? hotel.price_parity_score, 2)}</p>
              <p className="mt-2 text-sm text-stone-600">Direct price divided by OTA average. Closer to 1.00 is cleaner.</p>
            </div>
            <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Direct vs lowest OTA</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">
                {formatMoney(latest?.price_direct ?? hotel.price_direct, latest?.currency ?? 'USD')}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Lowest OTA: {formatMoney(latest?.price_lowest_ota ?? hotel.price_lowest_ota, latest?.currency ?? 'USD')}
              </p>
            </div>
          </div>
          {trendData.length > 1 ? (
            <div className="mt-5 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis dataKey="label" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
                  <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="direct" stroke={CHART_THEME.deepTerracotta} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="lowestOta" stroke={CHART_THEME.gold} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
