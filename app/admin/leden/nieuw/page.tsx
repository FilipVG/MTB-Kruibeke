'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NieuwLidPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '***REMOVED***',
    phone: '',
    birthdate: '',
    role: 'member' as 'member' | 'admin',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/admin/leden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Onbekende fout');
      setSaving(false);
      return;
    }
    router.push('/admin/leden');
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Nieuw lid</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Voornaam</label>
            <input required className="input" value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Familienaam</label>
            <input required className="input" value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">E-mailadres</label>
          <input required type="email" className="input" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Tijdelijk wachtwoord</label>
          <input required className="input" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} />
          <p className="text-xs text-ink-500 mt-1">Het lid kan dit later zelf wijzigen via zijn profiel.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Telefoon</label>
            <input className="input" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Geboortedatum</label>
            <input type="date" className="input" value={form.birthdate}
              onChange={e => setForm({ ...form, birthdate: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Rol</label>
          <select className="input" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value as 'member' | 'admin' })}>
            <option value="member">Lid</option>
            <option value="admin">Admin</option>
          </select>
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
            {saving ? 'Aanmaken…' : 'Lid aanmaken'}
          </button>
        </div>
      </form>
    </div>
  );
}
