'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Check, LogOut } from 'lucide-react';

interface RitRegel {
  id: string;
  title: string;
  start_at: string;
  start_location: string;
  ride_type: string;
  points: number;
  in_ranking: boolean;
  registration_open: boolean;
  cancelled: boolean;
  registration_id: string;
  attended: boolean | null;
}

interface Props {
  ritten: RitRegel[];
  userId: string;
}

function UitschrijfKnop({ registrationId, rideId }: { registrationId: string; rideId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function uitschrijven() {
    startTransition(async () => {
      await supabase.from('ride_registrations').delete().eq('id', registrationId);
      router.refresh();
    });
  }

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-xs text-ink-400">Zeker?</span>
        <button
          onClick={uitschrijven}
          disabled={pending}
          className="text-xs text-red-400 hover:text-red-300 border border-red-900/60 rounded-md px-2 py-1 transition disabled:opacity-50"
        >
          {pending ? 'Bezig…' : 'Ja'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-ink-400 hover:text-ink-200 border border-ink-700 rounded-md px-2 py-1 transition"
        >
          Nee
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Uitschrijven"
      className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-400 border border-ink-700 hover:border-red-900/60 rounded-md px-2.5 py-1.5 transition"
    >
      <LogOut className="h-3.5 w-3.5" />
      Uitschrijven
    </button>
  );
}

export function MijnRitten({ ritten, userId }: Props) {
  const now = new Date();

  if (ritten.length === 0) {
    return (
      <p className="text-sm text-ink-500 text-center py-6">
        Geen ritten gevonden voor dit jaar.
      </p>
    );
  }

  return (
    <div className="divide-y divide-ink-800">
      {ritten.map(rit => {
        const start = new Date(rit.start_at);
        const isVoorbij = start < now;
        const datumLabel = start.toLocaleDateString('nl-BE', {
          timeZone: 'Europe/Brussels',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });

        return (
          <div key={rit.id} className={cn('flex items-center gap-3 py-2 px-1', isVoorbij && 'opacity-60')}>
            {/* Datum */}
            <span className="w-20 shrink-0 text-xs text-ink-400 capitalize">{datumLabel}</span>

            {/* Titel */}
            <Link href={`/kalender/${rit.id}`} className="flex-1 min-w-0 text-sm font-medium text-white hover:text-brand-300 truncate">
              {rit.title}
            </Link>

            {/* Punten */}
            {rit.in_ranking && rit.points > 0 && (
              <span className="shrink-0 text-xs text-amber-400">{rit.points} pt</span>
            )}

            {/* Status / actie */}
            <div className="shrink-0">
              {isVoorbij ? (
                rit.attended ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400">
                    <Check className="h-3.5 w-3.5" /> Aanwezig
                  </span>
                ) : (
                  <span className="text-xs text-ink-500">Ingeschreven</span>
                )
              ) : (
                <UitschrijfKnop registrationId={rit.registration_id} rideId={rit.id} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
