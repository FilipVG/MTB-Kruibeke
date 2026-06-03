import type { SupabaseClient } from '@supabase/supabase-js';

export interface RideRating {
  avg: number;
  count: number;
}

/**
 * Haalt de gemiddelde score + aantal reviews op voor een set ritten,
 * via de publieke aggregaat-view ride_review_stats.
 */
export async function fetchRideRatings(
  supabase: SupabaseClient,
  rideIds: string[],
): Promise<Record<string, RideRating>> {
  const map: Record<string, RideRating> = {};
  const ids = [...new Set(rideIds)].filter(Boolean);
  if (ids.length === 0) return map;

  const { data } = await supabase
    .from('ride_review_stats')
    .select('ride_id, avg_score, review_count')
    .in('ride_id', ids);

  for (const row of data ?? []) {
    map[row.ride_id] = { avg: Number(row.avg_score), count: Number(row.review_count) };
  }
  return map;
}

/** Formatteert een gemiddelde score in Belgische notatie, bv. 4,2. */
export function formatRating(avg: number): string {
  return avg.toFixed(1).replace('.', ',');
}
