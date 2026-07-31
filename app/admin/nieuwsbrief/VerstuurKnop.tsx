'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Users, Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

interface Props {
  canSend: boolean;
  initialIntroText: string;
}

type SendState = 'idle' | 'sending-test' | 'sending-leden' | 'done' | 'error';

export function VerstuurKnop({ canSend, initialIntroText }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function currentHtml(): string {
    return editorRef.current?.innerHTML ?? '';
  }

  // Auto-save met debounce, gevoed door de huidige inhoud van de editor.
  function scheduleAutoSave() {
    const html = currentHtml();
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

  // Voert een opmaakcommando uit op de selectie. De knoppen gebruiken
  // onMouseDown+preventDefault zodat de selectie in de editor behouden blijft.
  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    scheduleAutoSave();
  }

  function addLink() {
    const url = window.prompt('Link-URL (bv. https://…):');
    if (url) exec('createLink', url.trim());
  }

  // Plakken als platte tekst — voorkomt rommelige opmaak uit Word e.d.
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    scheduleAutoSave();
  }

  async function send(test_mode: boolean) {
    setSendState(test_mode ? 'sending-test' : 'sending-leden');
    setMessage('');
    try {
      const res = await fetch('/api/admin/nieuwsbrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode, intro_text: currentHtml() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendState('done');
        setMessage(test_mode
          ? `Testmail verstuurd naar ${data.sent} admin${data.sent !== 1 ? 's' : ''}.`
          : `Off-Road Update verstuurd naar ${data.sent} lid${data.sent !== 1 ? 'en' : ''}.`
        );
        if (!test_mode && editorRef.current) editorRef.current.innerHTML = '';
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

  const toolbarBtn = 'p-1.5 rounded text-ink-300 hover:bg-ink-800 hover:text-white transition';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-ink-300 mb-1.5">
          Introtekst <span className="text-ink-500">(optioneel — verschijnt bovenaan de mail)</span>
        </label>

        {/* Opmaak-werkbalk */}
        <div className="flex items-center gap-1 mb-1.5 rounded-md border border-ink-700 bg-ink-900/50 px-1.5 py-1 w-fit">
          <button type="button" title="Vet" className={toolbarBtn}
            onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')}>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" title="Cursief" className={toolbarBtn}
            onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')}>
            <Italic className="h-4 w-4" />
          </button>
          <span className="w-px h-5 bg-ink-700 mx-0.5" />
          <button type="button" title="Opsomming" className={toolbarBtn}
            onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </button>
          <button type="button" title="Genummerde lijst" className={toolbarBtn}
            onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </button>
          <span className="w-px h-5 bg-ink-700 mx-0.5" />
          <button type="button" title="Link toevoegen" className={toolbarBtn}
            onMouseDown={e => e.preventDefault()} onClick={addLink}>
            <LinkIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Kort bericht voor de leden…"
          className="rte-editor input min-h-[180px] max-h-[420px] overflow-auto leading-relaxed"
          onInput={scheduleAutoSave}
          onBlur={() => saveIntro(currentHtml())}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: initialIntroText }}
        />
        <p className="text-xs text-ink-500 mt-1">Selecteer tekst en klik op een knop om op te maken. Plakken gebeurt als platte tekst.</p>
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
