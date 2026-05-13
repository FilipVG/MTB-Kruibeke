'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NieuweActiviteitPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    registration_required: false,
    max_participants: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from('activities').insert({
      title: form.title,
      description: form.description || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      location: form.location || null,
      registration_required: form.registration_required,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push('/admin/activiteiten');
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Nieuwe activiteit</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Titel</label>
          <input required className="input" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="bv. Jaarlijkse BBQ" />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Omschrijving (optioneel)</label>
          <textarea className="input min-h-[80px]" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Start datum & uur</label>
            <input required type="datetime-local" className="input" value={form.start_at}
              onChange={e => setForm({ ...form, start_at: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Einde (optioneel)</label>
            <input type="datetime-local" className="input" value={form.end_at}
              onChange={e => setForm({ ...form, end_at: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Locatie (optioneel)</label>
          <input className="input" value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="bv. Parking Kruibeke" />
        </div>

        <div className="pt-2 border-t border-ink-800 space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-200 cursor-pointer">
            <input type="checkbox" checked={form.registration_required}
              onChange={e => setForm({ ...form, registration_required: e.target.checked })}
              className="rounded border-ink-700 bg-ink-900 text-brand-700" />
            Inschrijving vereist
          </label>
          {form.registration_required && (
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Max. deelnemers (optioneel)</label>
              <input type="number" min="1" className="input w-32" value={form.max_participants}
                onChange={e => setForm({ ...form, max_participants: e.target.value })} />
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Annuleren</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Aanmaken…' : 'Activiteit aanmaken'}
          </button>
        </div>
      </form>
    </div>
  );
}
