'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Users } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface Props {
  canSend: boolean;
  initialIntroText: string;
}

type SendState = 'idle' | 'sending-test' | 'sending-leden' | 'done' | 'error';

export function VerstuurKnop({ canSend, initialIntroText }: Props) {
  const [introHtml, setIntroHtml] = useState(initialIntroText);
  const [editorKey, setEditorKey] = useState(0);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEditorChange(html: string) {
    setIntroHtml(html);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveIntro(html), 800);
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
        body: JSON.stringify({ test_mode, intro_text: introHtml }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendState('done');
        setMessage(test_mode
          ? `Testmail verstuurd naar ${data.sent} admin${data.sent !== 1 ? 's' : ''}.`
          : `Off-Road Update verstuurd naar ${data.sent} lid${data.sent !== 1 ? 'en' : ''}.`
        );
        if (!test_mode) { setIntroHtml(''); setEditorKey(k => k + 1); }
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
        <RichTextEditor
          key={editorKey}
          initialHtml={editorKey === 0 ? initialIntroText : ''}
          onChange={onEditorChange}
          placeholder="Kort bericht voor de leden…"
          className="min-h-[180px] max-h-[420px]"
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
