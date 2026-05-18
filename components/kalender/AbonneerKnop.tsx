'use client';

import { useState } from 'react';
import { CalendarDays, Copy, Check, X } from 'lucide-react';

export function AbonneerKnop({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const webcalUrl = url.replace(/^https?:\/\//, 'webcal://');

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-secondary">
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Abonneer op </span>Kalender
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 z-20 w-80 card p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">Kalenderlink</p>
              <button onClick={() => setOpen(false)} className="text-ink-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* iPhone / Apple Agenda */}
            <div className="mb-4">
              <p className="text-xs font-medium text-ink-300 mb-1.5">iPhone / Apple Agenda</p>
              <a
                href={webcalUrl}
                className="btn-secondary w-full justify-center text-xs"
                onClick={() => setOpen(false)}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Voeg toe aan Apple Agenda
              </a>
            </div>

            {/* Google / Outlook */}
            <div>
              <p className="text-xs font-medium text-ink-300 mb-1.5">Google Calendar / Outlook</p>
              <p className="text-xs text-ink-400 mb-2">Kopieer deze URL en plak ze in je agenda-app.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={url}
                  className="input text-xs flex-1 truncate"
                  onFocus={e => e.target.select()}
                />
                <button
                  onClick={copy}
                  className="btn-secondary shrink-0 px-3"
                  title="Kopieer link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {copied && <p className="text-xs text-green-400 mt-2">Gekopieerd!</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
