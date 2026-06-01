import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getDisplayName } from '@/lib/utils';

export default async function LidkaartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect(`/auth/login?redirect=/leden/${id}/lidkaart`);

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, nickname, vwb_card_url')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!member) notFound();
  if (!member.vwb_card_url) redirect(`/leden/${id}`);

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-12">
      <Link href={`/leden/${id}`} className="text-sm text-ink-400 hover:text-white mb-6 inline-flex items-center gap-1">
        ← {getDisplayName(member)}
      </Link>

      <h1 className="text-2xl font-semibold text-white mt-4 mb-6">VWB Lidkaart</h1>

      {member.vwb_card_url.includes('vwb-card.pdf') ? (
        <iframe
          src={member.vwb_card_url}
          title="VWB lidkaart"
          className="w-full rounded-xl border border-ink-700 shadow-lg"
          style={{ height: '600px' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.vwb_card_url}
          alt="VWB lidkaart"
          className="w-full rounded-xl border border-ink-700 shadow-lg object-cover"
          style={{ aspectRatio: '85.6/54' }}
        />
      )}
    </div>
  );
}
