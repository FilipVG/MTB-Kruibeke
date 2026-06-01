import { redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export default async function WK2026Layout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?redirect=/wk2026');

  const supabase = await createClient();
  const { data: settings } = await supabase.from('wk2026_settings').select('active').single();

  if (!settings?.active && current.profile.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">⚽</p>
        <h1 className="text-xl font-semibold text-white mb-2">WK 2026 module is niet actief</h1>
        <p className="text-ink-400">Kom later terug.</p>
      </div>
    );
  }

  return <>{children}</>;
}
