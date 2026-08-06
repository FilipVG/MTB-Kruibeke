import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VerslagForm } from '../VerslagForm';
import type { MeetingReport } from '@/lib/types/database';

export const metadata = { title: 'Verslag bewerken — Admin' };

export default async function BewerkVerslagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('meeting_reports').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Verslag bewerken</h1>
      <VerslagForm report={data as MeetingReport} />
    </div>
  );
}
