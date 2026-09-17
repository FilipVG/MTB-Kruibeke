'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { isRegistrationOpen, cn } from '@/lib/utils';
import { setRideRegistration } from '@/lib/registrations';

interface Props {
  rideId: string;
  registrationOpen: boolean;
  startAt: string;
  isRegistered: boolean;
  currentUserId: string | null;
}

export function RegistrationButton({ rideId, registrationOpen, startAt, isRegistered, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const canRegister = isRegistrationOpen({ registration_open: registrationOpen, start_at: startAt, cancelled: false });

  if (!canRegister) {
    return <p className="text-sm text-ink-500">Inschrijvingen zijn gesloten.</p>;
  }

  async function toggle() {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=/kalender/${rideId}`);
      return;
    }
    if (isRegistered && !window.confirm('Wil je je uitschrijven voor deze rit?')) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setRideRegistration(rideId, !isRegistered);
      if (!result.ok) {
        setMessage(result.error);
        if (result.needsLogin) router.push(`/auth/login?redirect=/kalender/${rideId}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
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
      {message && <p className="text-sm text-red-400">{message}</p>}
    </div>
  );
}
