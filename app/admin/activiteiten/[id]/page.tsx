'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { Activity } from '@/lib/types/database';

interface Registration {
  id: string;
  user_id: string;
  created_at: string;
  profile: { first_name: string | null; last_name: string | null; nickname: string | null };
}

export default function ActiviteitBeheerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState<Omit<Activity, 'id' | 'created_at' | 'created_by'> | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    supabase.from('activities').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setActivity(data);
        setForm({
          title: data.title,
          description: data.description ?? '',
          start_at: data.start_at.slice(0, 16),
          end_at: data.end_at ? data.end_at.slice(0, 16) : '',
          location: data.location ?? '',
          registration_required: data.registration_required,
          max_participants: data.max_participants,
          cancelled: data.cancelled,
        });
      }
    });

    supabase
      .from('activity_registrations')
      .select('id, user_id, created_at, profile:profiles(first_name, last_name, nickname)')
      .eq('activity_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setRegistrations((data as unknown as Registration[]) ?? []));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from('activities').update({
      title: form.title,
      description: form.description || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      location: form.location || null,
      registration_required: form.registration_required,
      max_participants: form.max_participants || null,
      cancelled: form.cancelled,
    }).eq('id', id);

    setSaving(false);
    setMessage(error ? `Fout: ${error.message}` : 'Opgeslagen.');
  }

  async function handleDelete() {
    await supabase.from('activities').delete().eq('id', id);
    router.push('/admin/activiteiten');
  }

  async function removeRegistration(regId: string) {
    await supabase.from('activity_registrations').delete().eq('id', regId);
    setRegistrations(prev => prev.filter(r => r.id !== regId));
  }

  if (!activity || !form) return <div className="p-12 text-center text-ink-400">Laden…</div>;

  const displayName = (p: Registration['profile']) =>
    p.nickname || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Onbekend';

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">{activity.title}</h1>
        <button onClick={() => router.push('/admin/activiteiten')} className="btn-secondary shrink-0">← Terug</button>
      </div>

      {/* Bewerken */}
      <section className="card p-6">
        <h2 className="font-semibold text-white text-lg mb-4">Activiteit bewerken</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Titel</label>
            <input required className="input" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Omschrijving</label>
            <textarea className="input min-h-[80px]" value={form.description ?? ''}
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
              <input type="datetime-local" className="input" value={form.end_at ?? ''}
                onChange={e => setForm({ ...form, end_at: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Locatie</label>
            <input className="input" value={form.location ?? ''}
              onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-ink-800">
            <label className="flex items-center gap-2 text-sm text-ink-200 cursor-pointer">
              <input type="checkbox" checked={form.registration_required}
                onChange={e => setForm({ ...form, registration_required: e.target.checked })}
                className="rounded border-ink-700 bg-ink-900 text-brand-700" />
              Inschrijving vereist
            </label>
            {form.registration_required && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-ink-200">Max. deelnemers:</label>
                <input type="number" min="1" className="input w-24"
                  value={form.max_participants ?? ''}
                  onChange={e => setForm({ ...form, max_participants: e.target.value ? Number(e.target.value) : null })} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-red-300 cursor-pointer">
              <input type="checkbox" checked={form.cancelled}
                onChange={e => setForm({ ...form, cancelled: e.target.checked })}
                className="rounded border-ink-700 bg-ink-900 text-red-700" />
              Afgelast
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            {message && (
              <p className={message.startsWith('Fout') ? 'text-red-400 text-sm' : 'text-green-400 text-sm'}>
                {message}
              </p>
            )}
            <button type="submit" disabled={saving} className="btn-primary ml-auto">
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </section>

      {/* Inschrijvingen */}
      {activity.registration_required && (
        <section className="card p-6">
          <h2 className="font-semibold text-white text-lg mb-4">
            Inschrijvingen ({registrations.length}{activity.max_participants ? ` / ${activity.max_participants}` : ''})
          </h2>
          {registrations.length === 0 ? (
            <p className="text-ink-400 text-sm">Nog niemand ingeschreven.</p>
          ) : (
            <div className="divide-y divide-ink-800">
              {registrations.map(reg => (
                <div key={reg.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-ink-200">{displayName(reg.profile)}</span>
                  <button
                    onClick={() => removeRegistration(reg.id)}
                    className="flex items-center gap-1 text-xs text-ink-500 hover:text-red-400 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    Verwijderen
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Verwijderen */}
      <section className="card p-6 border-red-900/40">
        <h2 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Activiteit verwijderen
        </h2>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="btn-secondary border-red-900/60 text-red-400 hover:bg-red-950/40">
            Verwijderen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-300">Zeker? Alle inschrijvingen worden ook verwijderd.</p>
            <button onClick={handleDelete} className="btn-primary bg-red-700 hover:bg-red-600">Ja, verwijderen</button>
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Annuleren</button>
          </div>
        )}
      </section>
    </div>
  );
}
