import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatRideDate } from '@/lib/utils';

export const metadata = { title: 'Ritten beheren — Admin' };

export default async function AdminRittenPage() {
  const supabase = await createClient();
  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .order('start_at', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Ritten</h1>
          <p className="text-sm text-ink-400 mt-1">Beheer komende en voorbije ritten.</p>
        </div>
        <Link href="/admin/ritten/nieuw" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuwe rit
        </Link>
      </div>

      <div className="card divide-y divide-ink-800">
        {(rides ?? []).map(ride => (
          <Link
            key={ride.id}
            href={`/admin/ritten/${ride.id}`}
            className="flex items-center justify-between p-4 hover:bg-ink-900/40 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={ride.ride_type === 'mtb' ? 'badge-mtb' : 'badge-gravel'}>
                  {ride.ride_type.toUpperCase()}
                </span>
                {ride.in_ranking && (
                  <span className="badge bg-brand-700/20 text-brand-200 border border-brand-700/30">
                    {ride.points} pt
                  </span>
                )}
                {ride.cancelled && (
                  <span className="badge bg-red-900/40 text-red-200 border border-red-800">Afgelast</span>
                )}
              </div>
              <p className="font-medium text-white truncate">{ride.title}</p>
              <p className="text-xs text-ink-500">{formatRideDate(ride.start_at)}</p>
            </div>
            <span className="text-ink-500">→</span>
          </Link>
        ))}
        {!rides?.length && (
          <div className="p-12 text-center text-ink-400">Nog geen ritten. Maak je eerste rit aan.</div>
        )}
      </div>
    </div>
  );
}
