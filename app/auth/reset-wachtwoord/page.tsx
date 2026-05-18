'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function ResetWachtwoordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // PKCE flow: sessie al gezet via callback → cookie aanwezig
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // Hash-fragment / implicit flow: Supabase vuurt PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card p-8 text-center text-ink-400">
          Even geduld, sessie wordt geladen…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Nieuw wachtwoord instellen</h1>
        <p className="text-sm text-ink-400 mb-6">Kies een nieuw wachtwoord voor je account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">Nieuw wachtwoord</label>
            <PasswordInput
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">Bevestig wachtwoord</label>
            <PasswordInput
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
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
