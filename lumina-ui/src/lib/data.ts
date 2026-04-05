import 'server-only';

import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type {
  ContentSeedRow,
  GuestPersonaRow,
  HotelCardData,
  HotelDashboardRow,
  HotelQnaRow,
  HotelTopicRow,
  LanguageBreakdownRow,
  ReviewTimelineRow,
  CompetitorNetworkRow,
} from '@/lib/types';

function normalizeHotelCardData(payload: unknown): HotelCardData {
  const value = (payload ?? {}) as Partial<HotelCardData>;
  return {
    hotel: (value.hotel ?? null) as HotelDashboardRow | null,
    topics: (value.topics ?? []) as HotelTopicRow[],
    timeline: (value.timeline ?? []) as ReviewTimelineRow[],
    competitors: (value.competitors ?? []) as CompetitorNetworkRow[],
    languages: (value.languages ?? []) as LanguageBreakdownRow[],
    personas: (value.personas ?? []) as GuestPersonaRow[],
    content_seeds: (value.content_seeds ?? []) as ContentSeedRow[],
    qna: (value.qna ?? []) as HotelQnaRow[],
  };
}

export const getPortfolioHotels = unstable_cache(
  async (): Promise<HotelDashboardRow[]> => {
    const { data, error } = await supabase
      .from('mv_hotel_dashboard')
      .select('*')
      .order('score_hqi', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data ?? []) as HotelDashboardRow[];
  },
  ['lumina-ui-portfolio-hotels'],
  { revalidate: 60 },
);

export const getHotelCard = unstable_cache(
  async (hotelId: string): Promise<HotelCardData> => {
    const { data, error } = await supabase.rpc('get_hotel_card', {
      target_hotel_id: hotelId,
    });

    if (error) throw error;
    return normalizeHotelCardData(data);
  },
  ['lumina-ui-hotel-card'],
  { revalidate: 60 },
);

export const getHotelsByIds = unstable_cache(
  async (hotelIds: string[]): Promise<HotelDashboardRow[]> => {
    if (!hotelIds.length) return [];
    const { data, error } = await supabase
      .from('mv_hotel_dashboard')
      .select('*')
      .in('hotel_id', hotelIds);

    if (error) throw error;
    return (data ?? []) as HotelDashboardRow[];
  },
  ['lumina-ui-compare-hotels'],
  { revalidate: 60 },
);
