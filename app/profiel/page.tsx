import { redirect } from 'next/navigation';
import { getCurrentUser, createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/members/ProfileForm';
import { MijnRitten } from '@/components/profiel/MijnRitten';
import { VwbCardUpload } from '@/components/members/VwbCardUpload';
import { fetchRideRatings } from '@/lib/reviews';

export const metadata = { title: 'Mijn profiel — MTB Kruibeke' };

export default async function ProfielPage() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect('/auth/login?redirect=/profiel');

  const supabase = await createClient();
  const huidigJaar = new Date().getFullYear();
  const startOfYear = new Date(huidigJaar, 0, 1).toISOString();
  const endOfYear = new Date(huidigJaar + 1, 0, 1).toISOString();

  const { data: regData } = await supabase
    .from('ride_registrations')
    .select(`
      id,
      attended,
      ride:rides(id, title, start_at, start_location, ride_type,
        points, in_ranking, registration_open, cancelled)
    `)
    .eq('user_id', current.user.id);

  const rittenRaw = (regData ?? [])
    .filter((r: any) => r.ride && r.ride.start_at >= startOfYear && r.ride.start_at < endOfYear && !r.ride.cancelled)
    .sort((a: any, b: any) => new Date(a.ride.start_at).getTime() - new Date(b.ride.start_at).getTime());

  const ratings = await fetchRideRatings(supabase, rittenRaw.map((r: any) => r.ride.id));

  // Jokerrit telt enkel mee voor punten als er minstens 4 leden aanwezig waren.
  const now = new Date();
  const jokerritIds = rittenRaw
    .filter((r: any) => r.ride.ride_type === 'jokerrit')
    .map((r: any) => r.ride.id);
  const qualifiedJokerrits = new Set<string>();
  if (jokerritIds.length > 0) {
    const { data: attendedRows } = await supabase
      .from('ride_registrations')
      .select('ride_id')
      .in('ride_id', jokerritIds)
      .eq('attended', true);
    const counts = new Map<string, number>();
    for (const row of attendedRows ?? []) counts.set(row.ride_id, (counts.get(row.ride_id) ?? 0) + 1);
    for (const [rid, c] of counts) if (c >= 4) qualifiedJokerrits.add(rid);
  }

  const ritten = rittenRaw.map((r: any) => {
    const isPast = new Date(r.ride.start_at) < now;
    // Werkelijk behaalde punten: enkel bij aanwezigheid, en jokerrit enkel indien gekwalificeerd.
    const pointsEarned = isPast && r.ride.in_ranking && r.attended === true
      ? (r.ride.ride_type === 'jokerrit'
          ? (qualifiedJokerrits.has(r.ride.id) ? r.ride.points : 0)
          : r.ride.points)
      : 0;
    return {
      ...r.ride,
      registration_id: r.id,
      attended: r.attended,
      avg_rating: ratings[r.ride.id]?.avg ?? null,
      review_count: ratings[r.ride.id]?.count ?? 0,
      points_earned: pointsEarned,
    };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Mijn profiel</h1>
        <p className="text-sm text-ink-400 mb-8">Pas je gegevens aan zoals ze in &laquo;Wie is wie&raquo; zichtbaar zijn.</p>
        <ProfileForm profile={current.profile} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Mijn ritten {huidigJaar}</h2>
        <p className="text-sm text-ink-400 mb-4">Ritten waaraan je deelneemt of hebt deelgenomen dit jaar.</p>
        <div className="card px-4 py-2">
          <MijnRitten ritten={ritten} userId={current.user.id} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-1">VWB Lidkaart</h2>
        <p className="text-sm text-ink-400 mb-4">Upload een foto of scan van je VWB-lidkaart. Zichtbaar voor alle ingelogde leden.</p>
        <VwbCardUpload profileId={current.user.id} hasCard={!!current.profile.vwb_card_url} />
      </div>
    </div>
  );
}
