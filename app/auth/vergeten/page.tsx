'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-wachtwoord`,
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Wachtwoord vergeten</h1>

        {sent ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-green-400">
              Als dit e-mailadres bij ons bekend is, ontvang je een resetlink. Controleer ook je spam.
            </p>
            <Link href="/auth/login" className="text-sm text-brand-400 hover:text-brand-300">
              ← Terug naar inloggen
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-400 mb-6">
              Vul je e-mailadres in. Je ontvangt een link om je wachtwoord opnieuw in te stellen.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-200 mb-1.5">E-mailadres</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Versturen…' : 'Stuur resetlink'}
              </button>
            </form>

            <p className="mt-4 text-sm text-ink-400 text-center">
              <Link href="/auth/login" className="text-brand-400 hover:text-brand-300">
                ← Terug naar inloggen
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
