import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VerslagForm } from '../VerslagForm';
import { RevisionHistory } from '@/components/verslagen/RevisionHistory';
import { ReadReceipts } from '@/components/verslagen/ReadReceipts';
import { VerslagDelete } from '@/components/verslagen/VerslagDelete';
import type { MeetingReport } from '@/lib/types/database';

export const metadata = { title: 'Verslag bewerken — Admin' };

export default async function BewerkVerslagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: revisions }, { data: reads }, { count: totalMembers }] = await Promise.all([
    supabase.from('meeting_reports').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('meeting_report_revisions')
      .select('*, editor:profiles!meeting_report_revisions_edited_by_fkey(id, nickname, first_name, last_name)')
      .eq('report_id', id)
      .order('edited_at', { ascending: true }),
    supabase
      .from('meeting_report_reads')
      .select('*, reader:profiles!meeting_report_reads_user_id_fkey(id, nickname, first_name, last_name)')
      .eq('report_id', id),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Verslag bewerken</h1>
      <VerslagForm report={data as MeetingReport} />
      <ReadReceipts reads={(reads ?? []) as any} totalMembers={totalMembers ?? 0} />
      <RevisionHistory revisions={(revisions ?? []) as any} />
      <VerslagDelete reportId={data.id} />
    </div>
  );
}
