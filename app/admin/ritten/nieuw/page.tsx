'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/utils';

function defaultReminderAt(startAt: string): string {
  if (!startAt) return '';
  const d = new Date(fromDatetimeLocal(startAt));
  d.setHours(d.getHours() - 24);
  return toDatetimeLocal(d.toISOString());
}

export default function NieuweRitPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    ride_type: 'mtb' as 'mtb' | 'gravel' | 'baanrit',
    start_at: '',
    reminder_at: '',
    start_location: '',
    distance_km: '',
    in_ranking: true,
    points: 2,
  });
  const [gpxFile, setGpxFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let gpx_url: string | null = null;
    if (gpxFile) {
      const path = `${Date.now()}-${gpxFile.name}`;
      const { error: upErr } = await supabase.storage.from('gpx').upload(path, gpxFile);
      if (upErr) {
        setError(`GPX upload mislukte: ${upErr.message}`);
        setSaving(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('gpx').getPublicUrl(path);
      gpx_url = publicUrl;
    }

    const { data, error } = await supabase
      .from('rides')
      .insert({
        ...form,
        distance_km: form.distance_km ? Number(form.distance_km) : null,
        start_at: fromDatetimeLocal(form.start_at),
        reminder_at: form.reminder_at ? fromDatetimeLocal(form.reminder_at) : null,
        gpx_url,
      })
      .select('id')
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push(`/admin/ritten/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Nieuwe rit</h1>

      <form onSubmit={handleSubmit} className="space-y-5 card p-6">
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Titel</label>
          <input
            required
            className="input"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="bv. Toertocht Hoge Kempen"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Type</label>
            <select
              className="input"
              value={form.ride_type}
              onChange={e => {
                const type = e.target.value as 'mtb' | 'gravel' | 'baanrit';
                const isRanking = type === 'mtb';
                setForm({ ...form, ride_type: type, in_ranking: isRanking, points: isRanking ? 2 : 0 });
              }}
            >
              <option value="mtb">MTB</option>
              <option value="gravel">Gravel</option>
              <option value="baanrit">Training op de baan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Datum & startuur</label>
            <input
              required
              type="datetime-local"
              className="input"
              value={form.start_at}
              onChange={e => setForm({ ...form, start_at: e.target.value, reminder_at: defaultReminderAt(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Email versturen</label>
          <input
            type="datetime-local"
            className="input"
            value={form.reminder_at}
            onChange={e => setForm({ ...form, reminder_at: e.target.value })}
          />
          <p className="text-xs text-ink-600 mt-1">Standaard 24u voor de start. Laat leeg om geen herinnering te sturen.</p>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Startlocatie</label>
          <input
            required
            className="input"
            value={form.start_location}
            onChange={e => setForm({ ...form, start_location: e.target.value })}
            placeholder="bv. Kerkplein Kruibeke"
          />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Afstand (km, optioneel)</label>
          <input
            type="number"
            step="0.5"
            className="input"
            value={form.distance_km}
            onChange={e => setForm({ ...form, distance_km: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Omschrijving</label>
          <textarea
            className="input min-h-[100px]"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Wat extra info over deze rit..."
          />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">GPX-bestand (optioneel)</label>
          <input
            type="file"
            accept=".gpx,application/gpx+xml"
            onChange={e => setGpxFile(e.target.files?.[0] ?? null)}
            className="text-sm text-ink-300"
          />
        </div>

        <div className="pt-3 border-t border-ink-800">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={form.in_ranking}
              onChange={e => setForm({ ...form, in_ranking: e.target.checked, points: e.target.checked ? 2 : 0 })}
              className="rounded border-ink-700 bg-ink-900 text-brand-700 focus:ring-brand-500"
            />
            <span className="text-sm text-ink-200">Telt mee voor puntenklassement</span>
          </label>
          {form.in_ranking && (
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Punten (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                className="input w-24"
                value={form.points}
                onChange={e => setForm({ ...form, points: Number(e.target.value) })}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Annuleren
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Aanmaken…' : 'Rit aanmaken'}
          </button>
        </div>
      </form>
    </div>
  );
}
