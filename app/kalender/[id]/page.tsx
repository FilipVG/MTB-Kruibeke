import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Trophy, Download, Users, Star } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatRideDate, getDisplayName, getInitials, cn } from '@/lib/utils';
import { RegistrationButton } from '@/components/rides/RegistrationButton';
import type { Profile } from '@/lib/types/database';

export default async function RitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const current = await getCurrentUser();

  type Registration = {
    id: string;
    user_id: string;
    profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'>;
  };

  const { data: ride } = await supabase
    .from('rides')
    .select(`*, registrations:ride_registrations(id, user_id, profile:profiles(id, nickname, first_name, last_name, avatar_url))`)
    .eq('id', id)
    .single();

  if (!ride) notFound();

  const registrations: Registration[] = ride.registrations ?? [];
  const isRegistered = current?.user
    ? registrations.some(r => r.user_id === current.user.id)
    : false;
  const isTopRit = ride.in_ranking && ride.points === 5;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <Link href="/kalender" className="text-sm text-ink-400 hover:text-white mb-6 inline-flex items-center gap-1">
        ← Kalender
      </Link>

      <div className={cn(
        'card p-6 sm:p-8 mt-4 relative overflow-hidden',
        isTopRit && 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-transparent',
      )}>
        {isTopRit && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={ride.ride_type === 'mtb' ? 'badge-mtb' : 'badge-gravel'}>
            {ride.ride_type === 'mtb' ? 'MTB' : 'Gravel'}
          </span>
          {ride.in_ranking && ride.points > 0 && (
            isTopRit ? (
              <span className="badge bg-amber-800/50 text-amber-300 border border-amber-600/50">
                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                5 punten
              </span>
            ) : (
              <span className="badge bg-brand-700/20 text-brand-200 border border-brand-700/30">
                <Trophy className="h-3 w-3 mr-1" />
                {ride.points} punt{ride.points !== 1 && 'en'}
              </span>
            )
          )}
          {ride.cancelled && (
            <span className="badge bg-red-900/40 text-red-200 border border-red-800">Afgelast</span>
          )}
        </div>

        {/* Titel */}
        <h1 className={cn('text-2xl sm:text-3xl font-semibold mb-5', isTopRit ? 'text-amber-50' : 'text-white')}>
          {ride.title}
        </h1>

        {/* Info */}
        <div className="space-y-2 text-sm text-ink-400 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatRideDate(ride.start_at)}</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.start_location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{ride.start_location}</span>
          </a>
          {ride.distance_km && (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 text-center text-xs font-bold">km</span>
              <span>{ride.distance_km} km</span>
            </div>
          )}
        </div>

        {/* Omschrijving */}
        {ride.description && (
          <p className="text-sm text-ink-300 leading-relaxed whitespace-pre-line border-t border-ink-800 pt-5 mb-6">
            {ride.description}
          </p>
        )}

        {/* GPX */}
        {ride.gpx_url && (
          <a
            href={ride.gpx_url}
            download
            className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 mb-6"
          >
            <Download className="h-4 w-4" />
            GPX downloaden
          </a>
        )}

        {/* Inschrijfknop */}
        {!ride.cancelled && (
          <div className="border-t border-ink-800 pt-5">
            <RegistrationButton
              rideId={ride.id}
              registrationOpen={ride.registration_open}
              startAt={ride.start_at}
              isRegistered={isRegistered}
              currentUserId={current?.user?.id ?? null}
            />
          </div>
        )}
      </div>

      {/* Ingeschrevenen — enkel voor ingelogde leden */}
      {current && (
        <div className="card p-6 mt-4">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-400" />
            Ingeschreven ({registrations.length})
          </h2>
          {registrations.length === 0 ? (
            <p className="text-sm text-ink-500">Nog niemand ingeschreven.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {registrations.map(reg => (
                <Link
                  key={reg.id}
                  href={`/leden/${reg.profile.id}`}
                  className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 rounded-full pl-1 pr-3 py-1 transition"
                >
                  <Avatar profile={reg.profile} />
                  <span className="text-sm text-ink-200">{getDisplayName(reg.profile)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Avatar({ profile }: { profile: Pick<Profile, 'avatar_url' | 'first_name' | 'last_name' | 'nickname'> }) {
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-medium text-white">
      {getInitials(profile)}
    </div>
  );
}
