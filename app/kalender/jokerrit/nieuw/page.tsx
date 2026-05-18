import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { JokerritForm } from '@/components/kalender/JokerritForm';

export const metadata = { title: 'Organiseer Jokerrit — MTB Kruibeke' };

export default async function NieuweJokerritPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?redirect=/kalender/jokerrit/nieuw');

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-2">Organiseer een Jokerrit</h1>
      <p className="text-sm text-ink-400 mb-8">
        Jij kiest de route en het tijdstip — de club rijdt mee.
      </p>
      <JokerritForm />
    </div>
  );
}
