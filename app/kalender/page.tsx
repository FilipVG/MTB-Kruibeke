import Link from 'next/link';
import { Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { RideListItem } from '@/components/rides/RideListItem';
import type { Ride, Profile } from '@/lib/types/database';

export const metadata = { title: 'Kalender — MTB Kruibeke' };

const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

interface Props {
  searchParams: Promise<{ maand?: string; jaar?: string }>;
}

export default async function KalenderPage({ searchParams }: Props) {
  const supabase = await createClient();
  const current = await getCurrentUser();
  const params = await searchParams;

  const now = new Date();
  const jaar = parseInt(params.jaar ?? String(now.getFullYear()));
  const maand = parseInt(params.maand ?? String(now.getMonth() + 1));

  const vanDatum = new Date(jaar, maand - 1, 1).toISOString();
  const totDatum = new Date(jaar, maand, 1).toISOString();

  // Vorige en volgende maand
  const vorigeDate = new Date(jaar, maand - 2, 1);
  const volgendeDate = new Date(jaar, maand, 1);
  const vorigeLink = `?maand=${vorigeDate.getMonth() + 1}&jaar=${vorigeDate.getFullYear()}`;
  const volgendeLink = `?maand=${volgendeDate.getMonth() + 1}&jaar=${volgendeDate.getFullYear()}`;

  const { data: rides } = await supabase
    .from('rides')
    .select(`
      *,
      registrations:ride_registrations(
        id,
        user_id,
        profile:profiles(id, nickname, first_name, last_name, avatar_url)
      )
    `)
    .gte('start_at', vanDatum)
    .lt('start_at', totDatum)
    .order('start_at', { ascending: true });

  type Registration = { id: string; user_id: string; profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'> };
  const ridesWithMeta = (rides ?? []).map((r: Ride & { registrations: Registration[] }) => ({
    ...r,
    registration_count: r.registrations?.length ?? 0,
    is_registered: current?.user
      ? r.registrations?.some(reg => reg.user_id === current.user.id)
      : false,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white flex items-center gap-3">
            <Calendar className="h-7 w-7 text-brand-500" />
            Kalender
          </h1>
          <p className="text-sm text-ink-400 mt-2">
            Alle geplande ritten en activiteiten.
            {!current && ' Log in om je in te schrijven.'}
          </p>
        </div>
        <Link
          href="/api/calendar.ics"
          className="btn-secondary self-start"
          title="Voeg deze feed toe aan Google Calendar, Apple Agenda, Outlook…"
        >
          <Download className="h-4 w-4" />
          Abonneer op kalender
        </Link>
      </div>

      {/* Maandnavigatie */}
      <div className="flex items-center justify-between mb-6 card px-5 py-3">
        <Link href={vorigeLink} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 hover:text-white transition">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-lg font-semibold text-white">
          {MAANDEN[maand - 1]} {jaar}
        </h2>
        <Link href={volgendeLink} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 hover:text-white transition">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {ridesWithMeta.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">
          Geen ritten gepland in {MAANDEN[maand - 1]} {jaar}.
        </div>
      ) : (
        <div className="space-y-3">
          {ridesWithMeta.map(ride => (
            <RideListItem
              key={ride.id}
              ride={ride}
              currentUserId={current?.user?.id ?? null}
              isAdmin={current?.profile?.role === 'admin'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
