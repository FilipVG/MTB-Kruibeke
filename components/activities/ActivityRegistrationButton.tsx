'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  activityId: string;
  isRegistered: boolean;
  currentUserId: string;
}

export function ActivityRegistrationButton({ activityId, isRegistered, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    if (isRegistered && !window.confirm('Wil je je uitschrijven voor deze activiteit?')) return;
    startTransition(async () => {
      if (isRegistered) {
        await supabase.from('activity_registrations').delete()
          .eq('activity_id', activityId).eq('user_id', currentUserId);
      } else {
        await supabase.from('activity_registrations').insert({ activity_id: activityId, user_id: currentUserId });
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition disabled:opacity-50',
        isRegistered
          ? 'border border-amber-700/40 bg-amber-900/30 text-amber-200 hover:bg-amber-900/50'
          : 'bg-amber-700 hover:bg-amber-600 text-white'
      )}
    >
      {isRegistered
        ? <><Check className="h-4 w-4" /> Ingeschreven — klik om uit te schrijven</>
        : 'Ik kom af!'}
    </button>
  );
}
