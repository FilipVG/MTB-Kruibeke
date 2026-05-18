'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/utils';

function minStartAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toDatetimeLocal(d.toISOString());
}

export function JokerritForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_at: '',
    start_location: '',
    distance_km: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/kalender/jokerrit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        start_at: fromDatetimeLocal(form.start_at),
      }),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? 'Onbekende fout');
      return;
    }

    router.push(`/kalender/${json.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      <div>
        <label className="block text-sm text-ink-200 mb-1.5">Naam van de rit</label>
        <input
          required
          className="input"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="bv. Zondagse Jokerrit Stekene"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Datum & startuur</label>
          <input
            required
            type="datetime-local"
            className="input"
            min={minStartAt()}
            value={form.start_at}
            onChange={e => setForm({ ...form, start_at: e.target.value })}
          />
          <p className="text-xs text-ink-600 mt-1">Minstens 1 week in de toekomst.</p>
        </div>
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Afstand (km, optioneel)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="input"
            value={form.distance_km}
            onChange={e => setForm({ ...form, distance_km: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-ink-200 mb-1.5">Startlocatie</label>
        <input
          required
          className="input"
          value={form.start_location}
          onChange={e => setForm({ ...form, start_location: e.target.value })}
          placeholder="bv. Parking kerk Stekene"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-200 mb-1.5">Omschrijving (optioneel)</label>
        <textarea
          className="input min-h-[80px]"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Route, moeilijkheidsgraad, bijzonderheden…"
        />
      </div>

      <div className="rounded-lg bg-purple-950/30 border border-purple-800/40 p-4 text-sm text-purple-200 space-y-1">
        <p className="font-medium">🃏 Jokerrit</p>
        <p className="text-xs text-purple-300">Telt voor 2 punten in het klassement als minstens 4 leden bevestigd aanwezig waren. Een herinneringsmail wordt automatisch 2 dagen voor de rit verstuurd.</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annuleren
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Aanmaken…' : 'Jokerrit aanmaken'}
        </button>
      </div>
    </form>
  );
}
