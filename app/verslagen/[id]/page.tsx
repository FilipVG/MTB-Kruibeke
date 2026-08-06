import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Paperclip, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRichText } from '@/lib/utils';
import type { MeetingReport } from '@/lib/types/database';

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'UTC',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

export default async function VerslagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: report } = await supabase
    .from('meeting_reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!report) notFound();
  const r = report as MeetingReport;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <Link href="/verslagen" className="text-sm text-ink-400 hover:text-white inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Alle verslagen
      </Link>

      <h1 className="text-2xl sm:text-3xl font-semibold text-white">{r.title}</h1>
      <p className="text-sm text-ink-400 mt-1 capitalize">{fmtDate(r.meeting_date)}</p>

      {r.attachment_url && (
        <a
          href={r.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 btn-secondary text-sm"
        >
          <Paperclip className="h-4 w-4" />
          Bijlage openen
        </a>
      )}

      {r.attendees && r.attendees.trim() && (
        <div className="card p-4 mt-6">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Aanwezigen
          </p>
          <p className="text-sm text-ink-200 whitespace-pre-wrap">{r.attendees}</p>
        </div>
      )}

      <div className="card p-6 sm:p-8 mt-6">
        {r.content.replace(/<[^>]*>/g, '').trim() ? (
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(r.content) }}
          />
        ) : (
          <p className="text-ink-500 text-sm">Geen tekstinhoud — zie de bijlage.</p>
        )}
      </div>
    </div>
  );
}
