import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/members/ProfileForm';

export const metadata = { title: 'Mijn profiel — MTB Kruibeke' };

export default async function ProfielPage() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect('/auth/login?redirect=/profiel');

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-2">Mijn profiel</h1>
      <p className="text-sm text-ink-400 mb-8">Pas je gegevens aan zoals ze in &laquo;Wie is wie&raquo; zichtbaar zijn.</p>
      <ProfileForm profile={current.profile} />
    </div>
  );
}
