import Link from 'next/link';
import { FileText, Plus, Paperclip, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { MeetingReport } from '@/lib/types/database';

export const metadata = { title: 'Verslagen beheren — Admin' };

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

export default async function AdminVerslagenPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('meeting_reports')
    .select('id, title, meeting_date, published, attachment_url')
    .order('meeting_date', { ascending: false });

  const reports = (data ?? []) as Pick<MeetingReport, 'id' | 'title' | 'meeting_date' | 'published' | 'attachment_url'>[];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <FileText className="h-7 w-7 text-brand-500" />
          Verslagen
        </h1>
        <Link href="/admin/verslagen/nieuw" className="btn-primary">
          <Plus className="h-4 w-4" /> Nieuw verslag
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">Nog geen verslagen. Maak er een aan.</div>
      ) : (
        <div className="card divide-y divide-ink-800">
          {reports.map(r => (
            <Link key={r.id} href={`/admin/verslagen/${r.id}`}
              className="flex items-center gap-4 p-4 sm:p-5 hover:bg-ink-800/40 transition group">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate group-hover:text-brand-200 transition flex items-center gap-2">
                  {r.title}
                  {!r.published && (
                    <span className="badge bg-ink-800 text-ink-400 border border-ink-700 inline-flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> concept
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-2 capitalize">
                  {fmtDate(r.meeting_date)}
                  {r.attachment_url && (
                    <span className="inline-flex items-center gap-1 text-ink-400 normal-case">
                      <Paperclip className="h-3 w-3" /> bijlage
                    </span>
                  )}
                </p>
              </div>
              <span className="text-sm text-brand-400 group-hover:text-brand-300 shrink-0">Bewerken →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
