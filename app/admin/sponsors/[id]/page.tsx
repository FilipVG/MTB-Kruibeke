'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';
import type { Sponsor } from '@/lib/types/database';

export default function SponsorBeheerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<Omit<Sponsor, 'id' | 'created_at'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    supabase.from('sponsors').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setSponsor(data);
        setForm({
          name: data.name,
          description: data.description ?? '',
          website_url: data.website_url ?? '',
          logo_url: data.logo_url,
          tier: data.tier,
          display_order: data.display_order,
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

    let logo_url = form.logo_url;
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sponsors').upload(path, logoFile);
      if (upErr) {
        setMessage(`Logo upload mislukt: ${upErr.message}`);
        setSaving(false);
        return;
      }
      logo_url = supabase.storage.from('sponsors').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('sponsors').update({
      ...form,
      description: form.description || null,
      website_url: form.website_url || null,
      logo_url,
    }).eq('id', id);

    setSaving(false);
    setMessage(error ? `Fout: ${error.message}` : 'Opgeslagen.');
    if (!error) setSponsor(s => s ? { ...s, ...form, logo_url } : s);
  }

  async function handleDelete() {
    await supabase.from('sponsors').delete().eq('id', id);
    router.push('/admin/sponsors');
  }

  if (!sponsor || !form) return <div className="p-12 text-center text-ink-400">Laden…</div>;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">{sponsor.name}</h1>
        <button onClick={() => router.push('/admin/sponsors')} className="btn-secondary shrink-0">← Terug</button>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-white text-lg mb-4">Sponsor bewerken</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Naam</label>
            <input required className="input" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Omschrijving</label>
            <textarea className="input min-h-[80px]" value={form.description ?? ''}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Website</label>
            <input type="url" className="input" value={form.website_url ?? ''} placeholder="https://"
              onChange={e => setForm({ ...form, website_url: e.target.value })} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Type</label>
              <select className="input" value={form.tier}
                onChange={e => setForm({ ...form, tier: e.target.value as 'main' | 'regular' })}>
                <option value="regular">Sponsor</option>
                <option value="main">Hoofdsponsor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Volgorde</label>
              <input type="number" min="0" className="input" value={form.display_order}
                onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Logo</label>
            <div className="flex items-center gap-4">
              {form.logo_url && !logoFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo_url} alt="" className="h-12 w-12 object-contain bg-white rounded p-1" />
              )}
              <input type="file" accept="image/*"
                onChange={e => setLogoFile(e.target.files?.[0] ?? null)}
                className="text-sm text-ink-300" />
            </div>
            {form.logo_url && (
              <button type="button" onClick={() => setForm({ ...form, logo_url: null })}
                className="text-xs text-red-400 hover:text-red-300 mt-1">
                Logo verwijderen
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-200 cursor-pointer pt-1">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-ink-700 bg-ink-900 text-brand-700" />
            Actief (zichtbaar op de sponsorpagina)
          </label>

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

      <section className="card p-6 border-red-900/40">
        <h2 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Sponsor verwijderen
        </h2>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="btn-secondary border-red-900/60 text-red-400 hover:bg-red-950/40">
            Verwijderen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-300">Zeker?</p>
            <button onClick={handleDelete} className="btn-primary bg-red-700 hover:bg-red-600">Ja, verwijderen</button>
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Annuleren</button>
          </div>
        )}
      </section>
    </div>
  );
}
