import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { JokerritForm } from '@/components/kalender/JokerritForm';
import { toDatetimeLocal } from '@/lib/utils';

export const metadata = { title: 'Jokerrit bewerken — MTB Kruibeke' };

export default async function JokerritBewerkenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect(`/auth/login?redirect=/kalender/jokerrit/${id}/bewerken`);

  const supabase = await createClient();
  const { data: ride } = await supabase
    .from('rides')
    .select('id, title, description, start_at, start_location, distance_km, ride_type, created_by')
    .eq('id', id)
    .single();

  if (!ride || ride.ride_type !== 'jokerrit') notFound();
  if (ride.created_by !== current.user.id) redirect(`/kalender/${id}`);

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-2">Jokerrit bewerken</h1>
      <p className="text-sm text-ink-400 mb-8">Pas de gegevens van je rit aan.</p>
      <JokerritForm
        rideId={id}
        initialValues={{
          title: ride.title,
          description: ride.description ?? '',
          start_at: toDatetimeLocal(ride.start_at),
          start_location: ride.start_location,
          distance_km: ride.distance_km ? String(ride.distance_km) : '',
        }}
      />
    </div>
  );
}
