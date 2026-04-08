import type { HotelAmenityRow, HotelDashboardRow } from '@/lib/types';
import { formatNumber, titleCase } from '@/lib/utils';

const FLAG_AMENITIES: Array<{ key: keyof HotelDashboardRow; label: string; category: string }> = [
  { key: 'ta_has_free_wifi', label: 'Free Wi-Fi', category: 'technology' },
  { key: 'ta_has_pool', label: 'Pool', category: 'wellness' },
  { key: 'ta_has_spa', label: 'Spa', category: 'wellness' },
  { key: 'ta_has_fitness', label: 'Fitness', category: 'wellness' },
  { key: 'ta_has_restaurant', label: 'Restaurant', category: 'dining' },
  { key: 'ta_has_bar', label: 'Bar', category: 'dining' },
  { key: 'ta_has_breakfast', label: 'Breakfast', category: 'dining' },
  { key: 'ta_has_room_service', label: 'Room service', category: 'service' },
  { key: 'ta_has_concierge', label: 'Concierge', category: 'service' },
  { key: 'ta_has_butler_service', label: 'Butler service', category: 'service' },
  { key: 'ta_has_airport_transfer', label: 'Airport transfer', category: 'access' },
  { key: 'ta_has_parking', label: 'Parking', category: 'access' },
  { key: 'ta_has_ev_charging', label: 'EV charging', category: 'access' },
  { key: 'ta_has_meeting_rooms', label: 'Meeting rooms', category: 'business' },
  { key: 'ta_has_business_center', label: 'Business center', category: 'business' },
  { key: 'ta_has_suites', label: 'Suites', category: 'rooms' },
  { key: 'ta_has_pet_friendly', label: 'Pet friendly', category: 'family' },
  { key: 'ta_has_accessible', label: 'Accessible', category: 'access' },
  { key: 'ta_has_babysitting', label: 'Babysitting', category: 'family' },
  { key: 'ta_has_air_conditioning', label: 'Air conditioning', category: 'rooms' },
  { key: 'ta_has_minibar', label: 'Minibar', category: 'rooms' },
];

const CATEGORY_STYLES: Record<string, string> = {
  wellness: 'bg-emerald-50 text-emerald-700',
  dining: 'bg-amber-50 text-amber-700',
  technology: 'bg-sky-50 text-sky-700',
  service: 'bg-rose-50 text-rose-700',
  access: 'bg-stone-100 text-stone-700',
  business: 'bg-indigo-50 text-indigo-700',
  rooms: 'bg-orange-50 text-orange-700',
  family: 'bg-violet-50 text-violet-700',
  sustainability: 'bg-teal-50 text-teal-700',
};

export function AmenitiesGrid({ hotel, amenities }: { hotel: HotelDashboardRow; amenities: HotelAmenityRow[] }) {
  const grouped = new Map<string, Set<string>>();
  for (const amenity of amenities) {
    const category = amenity.category ?? 'other';
    if (!grouped.has(category)) grouped.set(category, new Set<string>());
    grouped.get(category)?.add(amenity.amenity);
  }

  for (const flag of FLAG_AMENITIES) {
    if (hotel[flag.key]) {
      if (!grouped.has(flag.category)) grouped.set(flag.category, new Set<string>());
      grouped.get(flag.category)?.add(flag.label);
    }
  }

  const groups = [...grouped.entries()]
    .map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.items.length - a.items.length);

  if (!groups.length) {
    return <p className="text-sm text-stone-500">No amenity inventory captured yet.</p>;
  }

  const totalAmenities = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600">
        {formatNumber(totalAmenities)} amenities across {formatNumber(groups.length)} categories.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(group => (
          <div key={group.category} className="rounded-3xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--lumina-ink)]">{titleCase(group.category)}</h4>
              <span className="text-xs text-stone-500">{formatNumber(group.items.length)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map(item => (
                <span
                  key={item}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_STYLES[group.category] ?? 'bg-stone-100 text-stone-700'}`}
                >
                  {titleCase(item)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
