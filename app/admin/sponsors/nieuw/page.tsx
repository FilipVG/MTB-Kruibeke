'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NieuweSponsorPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    website_url: '',
    tier: 'regular' as 'main' | 'regular',
    display_order: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let logo_url: string | null = null;
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sponsors').upload(path, logoFile);
      if (upErr) {
        setError(`Logo upload mislukt: ${upErr.message}`);
        setSaving(false);
        return;
      }
      logo_url = supabase.storage.from('sponsors').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('sponsors').insert({
      ...form,
      description: form.description || null,
      website_url: form.website_url || null,
      logo_url,
      is_active: true,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push('/admin/sponsors');
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Nieuwe sponsor</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Naam</label>
          <input required className="input" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Omschrijving (optioneel)</label>
          <textarea className="input min-h-[80px]" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Website (optioneel)</label>
          <input type="url" className="input" value={form.website_url} placeholder="https://"
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
          <label className="block text-sm text-ink-200 mb-1.5">Logo (optioneel)</label>
          <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] ?? null)}
            className="text-sm text-ink-300" />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Annuleren</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Aanmaken…' : 'Sponsor aanmaken'}
          </button>
        </div>
      </form>
    </div>
  );
}
