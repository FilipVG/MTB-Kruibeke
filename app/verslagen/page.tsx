import Link from 'next/link';
import { FileText, Paperclip, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { MeetingReport } from '@/lib/types/database';

export const metadata = { title: 'Verslagen — MTB Kruibeke' };

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'UTC',
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

export default async function VerslagenPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('meeting_reports')
    .select('id, title, meeting_date, attachment_url')
    .eq('published', true)
    .order('meeting_date', { ascending: false });

  const reports = (data ?? []) as Pick<MeetingReport, 'id' | 'title' | 'meeting_date' | 'attachment_url'>[];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold text-white flex items-center gap-3">
        <FileText className="h-7 w-7 text-brand-500" />
        Verslagen
      </h1>
      <p className="text-sm text-ink-400 mt-2 mb-8">Verslagen van de clubvergaderingen.</p>

      {reports.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">Nog geen verslagen beschikbaar.</div>
      ) : (
        <div className="card divide-y divide-ink-800">
          {reports.map(r => (
            <Link
              key={r.id}
              href={`/verslagen/${r.id}`}
              className="flex items-center gap-4 p-4 sm:p-5 hover:bg-ink-800/40 transition group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate group-hover:text-brand-200 transition">{r.title}</p>
                <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-2 capitalize">
                  {fmtDate(r.meeting_date)}
                  {r.attachment_url && (
                    <span className="inline-flex items-center gap-1 text-ink-400 normal-case">
                      <Paperclip className="h-3 w-3" /> bijlage
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-600 group-hover:text-ink-300 shrink-0 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
