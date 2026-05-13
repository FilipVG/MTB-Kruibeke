'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  bio: string | null;
  role: string;
  is_active: boolean;
}

export default function LidBeheerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Omit<Profile, 'id'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          nickname: data.nickname ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          birthdate: data.birthdate ?? '',
          bio: data.bio ?? '',
          role: data.role ?? 'member',
          is_active: data.is_active,
        });
      }
    });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from('profiles').update({
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      nickname: form.nickname || null,
      phone: form.phone || null,
      birthdate: form.birthdate || null,
      bio: form.bio || null,
      role: form.role,
    }).eq('id', id);

    setSaving(false);
    setMessage(error ? `Fout: ${error.message}` : 'Opgeslagen.');
  }

  async function handleDeactivate() {
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    router.push('/admin/leden');
  }

  async function handleReactivate() {
    await supabase.from('profiles').update({ is_active: true }).eq('id', id);
    setForm(f => f ? { ...f, is_active: true } : f);
    setProfile(p => p ? { ...p, is_active: true } : p);
    setMessage('Lid is terug actief gezet.');
  }

  if (!profile || !form) return <div className="p-12 text-center text-ink-400">Laden…</div>;

  const naam = profile.nickname || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{naam}</h1>
          <p className="text-sm text-ink-400 mt-1">{profile.email}</p>
        </div>
        <button onClick={() => router.push('/admin/leden')} className="btn-secondary shrink-0">
          ← Terug
        </button>
      </div>

      {/* Gegevens bewerken */}
      <section className="card p-6">
        <h2 className="font-semibold text-white text-lg mb-4">Gegevens bewerken</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Voornaam</label>
              <input className="input" value={form.first_name ?? ''}
                onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Familienaam</label>
              <input className="input" value={form.last_name ?? ''}
                onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Roepnaam (optioneel)</label>
            <input className="input" value={form.nickname ?? ''}
              onChange={e => setForm({ ...form, nickname: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">E-mailadres</label>
            <input className="input bg-ink-900/50 cursor-not-allowed" value={form.email ?? ''} readOnly />
            <p className="text-xs text-ink-600 mt-1">E-mail kan niet gewijzigd worden.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Telefoon</label>
              <input className="input" value={form.phone ?? ''}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Geboortedatum</label>
              <input type="date" className="input" value={form.birthdate ?? ''}
                onChange={e => setForm({ ...form, birthdate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Over mezelf</label>
            <textarea className="input min-h-[80px]" value={form.bio ?? ''}
              onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Rol</label>
            <select className="input" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="member">Lid</option>
              <option value="admin">Admin</option>
            </select>
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

      {/* Activiteit */}
      <section className="card p-6 border-red-900/40">
        <h2 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          {profile.is_active ? 'Lid deactiveren' : 'Lid reactiveren'}
        </h2>

        {profile.is_active ? (
          <>
            <p className="text-sm text-ink-400 mb-4">
              Het lid wordt op inactief gezet en verdwijnt uit de ledenlijst. De login blijft bestaan.
            </p>
            {!confirmDeactivate ? (
              <button onClick={() => setConfirmDeactivate(true)}
                className="btn-secondary border-red-900/60 text-red-400 hover:bg-red-950/40">
                Deactiveren
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-red-300">Zeker?</p>
                <button onClick={handleDeactivate} className="btn-primary bg-red-700 hover:bg-red-600">
                  Ja, deactiveren
                </button>
                <button onClick={() => setConfirmDeactivate(false)} className="btn-secondary">
                  Annuleren
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-ink-400 mb-4">Dit lid is momenteel inactief.</p>
            <button onClick={handleReactivate} className="btn-secondary">
              Terug activeren
            </button>
          </>
        )}
      </section>
    </div>
  );
}
