'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Trophy, Download, Users, Check, X, Star } from 'lucide-react';
import { formatRideDate, isRegistrationOpen, getDisplayName, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';

interface Props {
  ride: {
    id: string;
    title: string;
    description: string | null;
    ride_type: 'mtb' | 'gravel';
    start_at: string;
    start_location: string;
    distance_km: number | null;
    gpx_url: string | null;
    in_ranking: boolean;
    points: number;
    registration_open: boolean;
    cancelled: boolean;
    registrations: { id: string; user_id: string; profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'> }[];
    registration_count: number;
    is_registered: boolean;
  };
  currentUserId: string | null;
  isAdmin: boolean;
}

export function RideListItem({ ride, currentUserId, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const canRegister = isRegistrationOpen(ride);
  const isRegistered = ride.is_registered;
  const isTopRit = ride.in_ranking && ride.points === 5;

  async function toggleRegistration() {
    if (!currentUserId) {
      router.push('/auth/login?redirect=/kalender');
      return;
    }
    startTransition(async () => {
      if (isRegistered) {
        await supabase
          .from('ride_registrations')
          .delete()
          .eq('ride_id', ride.id)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('ride_registrations')
          .insert({ ride_id: ride.id, user_id: currentUserId });
      }
      router.refresh();
    });
  }

  return (
    <article
      id={`rit-${ride.id}`}
      className={cn(
        'card transition relative overflow-hidden',
        ride.cancelled && 'opacity-50',
        isTopRit ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/20 to-transparent' : '',
        !isTopRit && isRegistered && 'border-brand-700/40',
      )}
    >
      {isTopRit && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
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
              {ride.distance_km && (
                <span className="badge bg-ink-800 text-ink-200 border border-ink-700">
                  {ride.distance_km} km
                </span>
              )}
              {ride.cancelled && (
                <span className="badge bg-red-900/40 text-red-200 border border-red-800">
                  Afgelast
                </span>
              )}
            </div>
            <Link href={`/kalender/${ride.id}`} className="text-lg font-medium text-white hover:text-brand-200 transition">
              {ride.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatRideDate(ride.start_at)}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.start_location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                <MapPin className="h-3.5 w-3.5" />
                {ride.start_location}
              </a>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {ride.registration_count} ingeschreven
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {canRegister ? (
              <button
                onClick={toggleRegistration}
                disabled={pending}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50',
                  isRegistered
                    ? 'border border-brand-700/40 bg-brand-900/30 text-brand-200 hover:bg-brand-900/50'
                    : 'btn-primary'
                )}
              >
                {isRegistered ? (
                  <>
                    <Check className="h-4 w-4" />
                    Ingeschreven
                  </>
                ) : (
                  'Ik kom af!'
                )}
              </button>
            ) : (
              <span className="text-xs text-ink-500">Inschrijvingen gesloten</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-ink-400 hover:text-brand-300"
        >
          {expanded ? 'Verberg details' : 'Toon details'}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-ink-800 space-y-4">
            {ride.description && (
              <p className="text-sm text-ink-300 leading-relaxed whitespace-pre-line">
                {ride.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {ride.gpx_url && (
                <a
                  href={ride.gpx_url}
                  download
                  className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
                >
                  <Download className="h-4 w-4" />
                  GPX downloaden
                </a>
              )}
            </div>

            {ride.registrations.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-ink-500 mb-2">
                  Ingeschreven ({ride.registrations.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {ride.registrations.map(reg => (
                    <span
                      key={reg.id}
                      className="text-xs bg-ink-800 px-2.5 py-1 rounded-full text-ink-200"
                    >
                      {getDisplayName(reg.profile)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="pt-3 border-t border-ink-800">
                <a
                  href={`/admin/ritten/${ride.id}`}
                  className="text-xs text-brand-400 hover:text-brand-300"
                >
                  Beheren →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
