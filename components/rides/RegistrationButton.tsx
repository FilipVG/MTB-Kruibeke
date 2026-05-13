'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isRegistrationOpen, cn } from '@/lib/utils';

interface Props {
  rideId: string;
  registrationOpen: boolean;
  startAt: string;
  isRegistered: boolean;
  currentUserId: string | null;
}

export function RegistrationButton({ rideId, registrationOpen, startAt, isRegistered, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const canRegister = isRegistrationOpen({ registration_open: registrationOpen, start_at: startAt, cancelled: false });

  if (!canRegister) {
    return <p className="text-sm text-ink-500">Inschrijvingen zijn gesloten.</p>;
  }

  async function toggle() {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=/kalender/${rideId}`);
      return;
    }
    startTransition(async () => {
      if (isRegistered) {
        await supabase.from('ride_registrations').delete()
          .eq('ride_id', rideId).eq('user_id', currentUserId);
      } else {
        await supabase.from('ride_registrations').insert({ ride_id: rideId, user_id: currentUserId });
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
          ? 'border border-brand-700/40 bg-brand-900/30 text-brand-200 hover:bg-brand-900/50'
          : 'btn-primary'
      )}
    >
      {isRegistered ? <><Check className="h-4 w-4" /> Ingeschreven — klik om uit te schrijven</> : 'Ik kom af!'}
    </button>
  );
}
