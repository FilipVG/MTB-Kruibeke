'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Users } from 'lucide-react';

interface Props {
  canSend: boolean;
  initialIntroText: string;
}

type SendState = 'idle' | 'sending-test' | 'sending-leden' | 'done' | 'error';

export function VerstuurKnop({ canSend, initialIntroText }: Props) {
  const [introText, setIntroText] = useState(initialIntroText);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleAutoSave(text: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveIntro(text), 800);
  }

  async function saveIntro(text: string) {
    await fetch('/api/admin/nieuwsbrief/instellingen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intro_text: text }),
    });
  }

  async function send(test_mode: boolean) {
    setSendState(test_mode ? 'sending-test' : 'sending-leden');
    setMessage('');
    try {
      const res = await fetch('/api/admin/nieuwsbrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode, intro_text: introText }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendState('done');
        setMessage(test_mode
          ? `Testmail verstuurd naar ${data.sent} admin${data.sent !== 1 ? 's' : ''}.`
          : `Off-Road Update verstuurd naar ${data.sent} lid${data.sent !== 1 ? 'en' : ''}.`
        );
        if (!test_mode) setIntroText('');
        router.refresh();
      } else {
        setSendState('error');
        setMessage(data.error ?? 'Onbekende fout.');
      }
    } catch {
      setSendState('error');
      setMessage('Netwerkfout. Probeer opnieuw.');
    }
  }

  const busy = sendState === 'sending-test' || sendState === 'sending-leden';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-ink-300 mb-1.5">
          Introtekst <span className="text-ink-500">(optioneel — verschijnt bovenaan de mail)</span>
        </label>
        <textarea
          className="input min-h-[80px] w-full"
          value={introText}
          placeholder="Kort bericht voor de leden…"
          onChange={e => { setIntroText(e.target.value); scheduleAutoSave(e.target.value); }}
          onBlur={e => saveIntro(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => send(true)}
          disabled={!canSend || busy}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {sendState === 'sending-test' ? 'Versturen…' : 'Verstuur test'}
        </button>
        <button
          onClick={() => send(false)}
          disabled={!canSend || busy}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          {sendState === 'sending-leden' ? 'Versturen…' : 'Verstuur leden'}
        </button>
      </div>

      {!canSend && sendState === 'idle' && (
        <p className="text-sm text-ink-500">Geen nieuwe of gewijzigde items — niets te versturen.</p>
      )}
      {message && (
        <p className={`text-sm ${sendState === 'done' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
