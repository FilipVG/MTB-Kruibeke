'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Trophy, Users, Check } from 'lucide-react';
import { formatRideDate, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';

interface Props {
  ride: {
    id: string;
    title: string;
    ride_type: 'mtb' | 'gravel';
    start_at: string;
    start_location: string;
    in_ranking: boolean;
    points: number;
    registration_open: boolean;
    cancelled: boolean;
    registrations: { id: string; user_id: string; profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'> }[];
    registration_count: number;
    is_registered: boolean;
  };
  currentUserId: string | null;
}

export function RideCardCompact({ ride, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  async function toggleRegistration(e: React.MouseEvent) {
    e.preventDefault();
    if (!currentUserId) {
      router.push('/auth/login?redirect=/');
      return;
    }
    startTransition(async () => {
      if (ride.is_registered) {
        await supabase.from('ride_registrations').delete()
          .eq('ride_id', ride.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('ride_registrations').insert({ ride_id: ride.id, user_id: currentUserId });
      }
      router.refresh();
    });
  }

  const canRegister = ride.registration_open && !ride.cancelled;

  return (
    <div className={cn('card p-5 flex flex-col gap-3', ride.is_registered && 'border-brand-700/40')}>
      {/* Badges + teller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={ride.ride_type === 'mtb' ? 'badge-mtb' : 'badge-gravel'}>
            {ride.ride_type === 'mtb' ? 'MTB' : 'Gravel'}
          </span>
          {ride.in_ranking && ride.points > 0 && (
            <span className="badge bg-brand-700/20 text-brand-200 border border-brand-700/30">
              <Trophy className="h-3 w-3 mr-1" />
              {ride.points} pt
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-ink-500">
          <Users className="h-3.5 w-3.5" />
          {ride.registration_count}
        </span>
      </div>

      {/* Titel */}
      <h3 className="font-medium text-white leading-snug">{ride.title}</h3>

      {/* Datum + locatie */}
      <div className="space-y-1 text-xs text-ink-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatRideDate(ride.start_at)}</span>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.start_location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-white transition"
          onClick={e => e.stopPropagation()}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ride.start_location}</span>
        </a>
      </div>

      {/* Knop */}
      {canRegister && (
        <button
          onClick={toggleRegistration}
          disabled={pending}
          className={cn(
            'mt-auto w-full rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50',
            ride.is_registered
              ? 'border border-brand-700/40 bg-brand-900/30 text-brand-200 hover:bg-brand-900/50 flex items-center justify-center gap-1.5'
              : 'btn-primary justify-center'
          )}
        >
          {ride.is_registered ? <><Check className="h-3.5 w-3.5" /> Ingeschreven</> : 'Ik kom af!'}
        </button>
      )}
    </div>
  );
}
