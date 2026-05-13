'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Welkom terug</h1>
        <p className="text-sm text-ink-400 mb-6">Log in om je in te schrijven voor ritten.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-200 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-200 mb-1.5">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-400 text-center">
          Nog geen account?{' '}
          <Link href="/lid-worden" className="text-brand-400 hover:text-brand-300">
            Word lid
          </Link>
        </p>
      </div>
    </div>
  );
}
