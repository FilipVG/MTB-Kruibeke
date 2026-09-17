'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setActivityRegistration } from '@/lib/registrations';

interface Props {
  activityId: string;
  isRegistered: boolean;
  currentUserId: string;
}

export function ActivityRegistrationButton({ activityId, isRegistered }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function toggle() {
    if (isRegistered && !window.confirm('Wil je je uitschrijven voor deze activiteit?')) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setActivityRegistration(activityId, !isRegistered);
      if (!result.ok) {
        setMessage(result.error);
        if (result.needsLogin) router.push(`/auth/login?redirect=/kalender/activiteiten/${activityId}`);
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
            ? 'border border-amber-700/40 bg-amber-900/30 text-amber-200 hover:bg-amber-900/50'
            : 'bg-amber-700 hover:bg-amber-600 text-white'
        )}
      >
        {isRegistered
          ? <><Check className="h-4 w-4" /> Ingeschreven — klik om uit te schrijven</>
          : 'Ik kom af!'}
      </button>
      {message && <p className="text-sm text-red-400">{message}</p>}
    </div>
  );
}
