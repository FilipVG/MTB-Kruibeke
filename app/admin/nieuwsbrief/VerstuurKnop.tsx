'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

interface Props {
  canSend: boolean;
}

export function VerstuurKnop({ canSend }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function send() {
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/admin/nieuwsbrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('done');
        setMessage(`Verstuurd naar ${data.sent} ontvanger${data.sent !== 1 ? 's' : ''} (testmodus — enkel admins).`);
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

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={send}
        disabled={!canSend || state === 'sending'}
        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Send className="h-4 w-4" />
        {state === 'sending' ? 'Versturen…' : 'Verstuur test (admins only)'}
      </button>
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
