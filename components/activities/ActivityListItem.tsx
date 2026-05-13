'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Check, PartyPopper } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Activity } from '@/lib/types/database';

interface Props {
  activity: Activity & {
    registration_count: number;
    is_registered: boolean;
  };
  currentUserId: string | null;
  isAdmin: boolean;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ActivityListItem({ activity, currentUserId, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  async function toggleRegistration() {
    if (!currentUserId) {
      router.push('/auth/login?redirect=/kalender');
      return;
    }
    startTransition(async () => {
      if (activity.is_registered) {
        await supabase
          .from('activity_registrations')
          .delete()
          .eq('activity_id', activity.id)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('activity_registrations')
          .insert({ activity_id: activity.id, user_id: currentUserId });
      }
      router.refresh();
    });
  }

  const registrationFull =
    activity.max_participants !== null &&
    activity.registration_count >= activity.max_participants;

  const canRegister =
    activity.registration_required &&
    !activity.cancelled &&
    (!registrationFull || activity.is_registered);

  return (
    <article
      className={cn(
        'card border-amber-800/30 transition',
        activity.cancelled && 'opacity-50',
        activity.is_registered && 'border-amber-600/40'
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="badge bg-amber-900/40 text-amber-300 border border-amber-700/40">
                <PartyPopper className="h-3 w-3 mr-1" />
                Activiteit
              </span>
              {activity.cancelled && (
                <span className="badge bg-red-900/40 text-red-200 border border-red-800">Afgelast</span>
              )}
              {registrationFull && !activity.is_registered && (
                <span className="badge bg-ink-800 text-ink-400 border border-ink-700">Volzet</span>
              )}
            </div>
            <h3 className="text-lg font-medium text-white">{activity.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(activity.start_at)}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {activity.location}
                </span>
              )}
              {activity.registration_required && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {activity.registration_count}
                  {activity.max_participants ? ` / ${activity.max_participants}` : ''} ingeschreven
                </span>
              )}
            </div>
          </div>

          {canRegister && (
            <div className="shrink-0">
              <button
                onClick={toggleRegistration}
                disabled={pending}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50',
                  activity.is_registered
                    ? 'border border-amber-700/40 bg-amber-900/30 text-amber-200 hover:bg-amber-900/50'
                    : 'bg-amber-700 hover:bg-amber-600 text-white'
                )}
              >
                {activity.is_registered ? (
                  <><Check className="h-4 w-4" /> Ingeschreven</>
                ) : (
                  'Ik kom!'
                )}
              </button>
            </div>
          )}
        </div>

        {(activity.description || isAdmin) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-ink-400 hover:text-amber-300"
          >
            {expanded ? 'Verberg details' : 'Toon details'}
          </button>
        )}

        {expanded && (
          <div className="mt-4 pt-4 border-t border-ink-800 space-y-3">
            {activity.description && (
              <p className="text-sm text-ink-300 leading-relaxed whitespace-pre-line">
                {activity.description}
              </p>
            )}
            {isAdmin && (
              <div className="pt-2 border-t border-ink-800">
                <a href={`/admin/activiteiten/${activity.id}`} className="text-xs text-amber-400 hover:text-amber-300">
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
