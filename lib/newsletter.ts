import type { SupabaseClient } from '@supabase/supabase-js';

export type NewsletterItemStatus = 'new' | 'updated' | 'cancelled' | 'existing';

export interface NewsletterRide {
  id: string;
  title: string;
  start_at: string;
  ride_type: string;
  start_location: string;
  distance_km: number | null;
  in_ranking: boolean;
  points: number;
  cancelled: boolean;
  status: NewsletterItemStatus;
}

export interface NewsletterActivity {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  location: string | null;
  registration_required: boolean;
  cancelled: boolean;
  status: NewsletterItemStatus;
}

export interface NewsletterRun {
  id: string;
  sent_at: string;
  recipient_count: number;
  test_mode: boolean;
  new_item_count: number;
}

export interface NewsletterData {
  lastRun: NewsletterRun | null;
  rides: NewsletterRide[];
  activities: NewsletterActivity[];
  changedCount: number;
}

export async function getNewsletterData(supabase: SupabaseClient): Promise<NewsletterData> {
  const now = new Date().toISOString();
  const in3Months = new Date();
  in3Months.setMonth(in3Months.getMonth() + 3);
  const ridesMaxDate = in3Months.toISOString();
  const in12Months = new Date();
  in12Months.setFullYear(in12Months.getFullYear() + 1);
  const activitiesMaxDate = in12Months.toISOString();

  const { data: lastRunData } = await supabase
    .from('newsletter_runs')
    .select('id, sent_at, recipient_count, test_mode, new_item_count')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastRunAt = lastRunData?.sent_at ?? '1970-01-01T00:00:00Z';

  function computeStatus(item: { created_at: string; updated_at: string; cancelled: boolean }): NewsletterItemStatus {
    const createdAfter = item.created_at > lastRunAt;
    const updatedAfter = item.updated_at > lastRunAt;
    if (item.cancelled && updatedAfter) return 'cancelled';
    if (createdAfter) return 'new';
    if (updatedAfter) return 'updated';
    return 'existing';
  }

  const [{ data: ridesData }, { data: activitiesData }] = await Promise.all([
    supabase
      .from('rides')
      .select('id, title, start_at, ride_type, start_location, distance_km, in_ranking, points, cancelled, created_at, updated_at')
      .gte('start_at', now)
      .lte('start_at', ridesMaxDate)
      .order('start_at', { ascending: true }),
    supabase
      .from('activities')
      .select('id, title, start_at, end_at, location, registration_required, cancelled, created_at, updated_at')
      .gte('start_at', now)
      .lte('start_at', activitiesMaxDate)
      .order('start_at', { ascending: true }),
  ]);

  const rides: NewsletterRide[] = (ridesData ?? []).map((r: any) => ({
    ...r,
    status: computeStatus(r),
  }));

  const activities: NewsletterActivity[] = (activitiesData ?? []).map((a: any) => ({
    ...a,
    status: computeStatus(a),
  }));

  const changedCount = [...rides, ...activities].filter(i => i.status !== 'existing').length;

  return {
    lastRun: lastRunData ?? null,
    rides,
    activities,
    changedCount,
  };
}
