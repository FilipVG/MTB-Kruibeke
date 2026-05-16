'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetWachtwoordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Wachtwoord moet minstens 8 tekens bevatten.');
      return;
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/profiel?wachtwoord=gewijzigd');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Nieuw wachtwoord instellen</h1>
        <p className="text-sm text-ink-400 mb-6">Kies een nieuw wachtwoord voor je account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">Nieuw wachtwoord</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">Bevestig wachtwoord</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Opslaan…' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  );
}
