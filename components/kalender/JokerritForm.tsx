'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fromDatetimeLocal, defaultStartAt, DEFAULT_POINTS } from '@/lib/utils';
import { DateTimeEcho } from '@/components/ui/DateTimeEcho';

const TYPE_OPTIONS: { value: keyof typeof DEFAULT_POINTS; label: string }[] = [
  { value: 'mtb', label: 'MTB' },
  { value: 'baanrit', label: 'Training op de baan' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'wedstrijd', label: 'Wedstrijd' },
];

function minStartDatetime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().slice(0, 10) + 'T00:00';
}

interface Props {
  rideId?: string;
  initialValues?: {
    title: string;
    description: string;
    start_at: string; // datetime-local formaat
    start_location: string;
    distance_km: string;
    ride_type?: keyof typeof DEFAULT_POINTS;
  };
}

export function JokerritForm({ rideId, initialValues }: Props) {
  const router = useRouter();
  const isEdit = !!rideId;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    ride_type: initialValues?.ride_type ?? 'mtb' as keyof typeof DEFAULT_POINTS,
    start_at: initialValues?.start_at ?? defaultStartAt(5),
    start_location: initialValues?.start_location ?? '',
    distance_km: initialValues?.distance_km ?? '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(
      isEdit ? `/api/kalender/jokerrit/${rideId}` : '/api/kalender/jokerrit',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          start_at: fromDatetimeLocal(form.start_at),
        }),
      }
    );

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? 'Onbekende fout');
      return;
    }

    router.push(`/kalender/${isEdit ? rideId : json.id}`);
    router.refresh();
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

      <div>
        <label className="block text-sm text-ink-200 mb-1.5">Type rit</label>
        <select
          className="input"
          value={form.ride_type}
          onChange={e => setForm({ ...form, ride_type: e.target.value as keyof typeof DEFAULT_POINTS })}
        >
          {TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label} — {DEFAULT_POINTS[o.value]} punt{DEFAULT_POINTS[o.value] !== 1 ? 'en' : ''}</option>
          ))}
        </select>
        <p className="text-xs text-ink-600 mt-1">Bepaalt de punten van de jokerrit.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Datum & startuur</label>
          <input
            required
            type="datetime-local"
            className="input"
            min={minStartDatetime()}
            value={form.start_at}
            onChange={e => setForm({ ...form, start_at: e.target.value })}
          />
          <DateTimeEcho value={form.start_at} />
          <p className="text-xs text-ink-600 mt-1">Minstens 5 dagen in de toekomst.</p>
        </div>
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Afstand (km, optioneel)</label>
          <input
            type="text"
            className="input"
            placeholder="bv. 48-58-68"
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
        <p className="font-medium">🤡 Jokerrit</p>
        <p className="text-xs text-purple-300">Telt voor {DEFAULT_POINTS[form.ride_type]} punt{DEFAULT_POINTS[form.ride_type] !== 1 ? 'en' : ''} in het klassement als minstens 4 leden bevestigd aanwezig waren. Een herinneringsmail wordt automatisch 2 dagen voor de rit verstuurd.</p>
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
          {saving ? (isEdit ? 'Opslaan…' : 'Aanmaken…') : (isEdit ? 'Wijzigingen opslaan' : 'Jokerrit aanmaken')}
        </button>
      </div>
    </form>
  );
}
