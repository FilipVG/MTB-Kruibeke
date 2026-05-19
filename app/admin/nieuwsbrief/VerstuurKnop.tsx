'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Users } from 'lucide-react';

interface Props {
  canSend: boolean;
}

type State = 'idle' | 'sending-test' | 'sending-leden' | 'done' | 'error';

export function VerstuurKnop({ canSend }: Props) {
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function send(test_mode: boolean) {
    setState(test_mode ? 'sending-test' : 'sending-leden');
    setMessage('');
    try {
      const res = await fetch('/api/admin/nieuwsbrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('done');
        setMessage(test_mode
          ? `Testmail verstuurd naar ${data.sent} admin${data.sent !== 1 ? 's' : ''}.`
          : `Off-Road Update verstuurd naar ${data.sent} lid${data.sent !== 1 ? 'en' : ''}.`
        );
        router.refresh();
      } else {
        setState('error');
        setMessage(data.error ?? 'Onbekende fout.');
      }
    } catch {
      setState('error');
      setMessage('Netwerkfout. Probeer opnieuw.');
    }
  }

  const busy = state === 'sending-test' || state === 'sending-leden';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => send(true)}
          disabled={!canSend || busy}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {state === 'sending-test' ? 'Versturen…' : 'Verstuur test'}
        </button>

        <button
          onClick={() => send(false)}
          disabled={!canSend || busy}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          {state === 'sending-leden' ? 'Versturen…' : 'Verstuur leden'}
        </button>
      </div>

      {!canSend && state === 'idle' && (
        <p className="text-sm text-ink-500">Geen nieuwe of gewijzigde items — niets te versturen.</p>
      )}
      {message && (
        <p className={`text-sm ${state === 'done' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
