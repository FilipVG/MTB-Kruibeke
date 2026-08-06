import { Clock } from 'lucide-react';
import { getDisplayName, sanitizeRichText } from '@/lib/utils';
import type { MeetingReportRevision, Profile } from '@/lib/types/database';

type RevisionWithEditor = MeetingReportRevision & {
  editor: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name'> | null;
};

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

/** Ontvangt de revisies OPLOPEND op edited_at (oudste eerst). */
export function RevisionHistory({ revisions }: { revisions: RevisionWithEditor[] }) {
  if (revisions.length === 0) return null;

  const items = revisions.map((rev, i) => {
    const prev = i > 0 ? revisions[i - 1] : null;
    let changes: string[];
    if (!prev) {
      changes = ['aangemaakt'];
    } else {
      changes = [];
      if (rev.title !== prev.title) changes.push('titel');
      if (rev.meeting_date !== prev.meeting_date) changes.push('datum');
      if ((rev.attendees ?? '') !== (prev.attendees ?? '')) changes.push('aanwezigen');
      if (rev.content !== prev.content) changes.push('inhoud');
      if (rev.published !== prev.published) changes.push(rev.published ? 'gepubliceerd' : 'teruggezet naar concept');
      if ((rev.attachment_url ?? '') !== (prev.attachment_url ?? '')) changes.push('bijlage');
      if (changes.length === 0) changes = ['bijgewerkt'];
    }
    return { rev, changes };
  }).reverse(); // nieuwste eerst

  return (
    <section className="card p-6 mt-6">
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-ink-400" />
        Wijzigingsgeschiedenis
      </h2>
      <ol className="space-y-4">
        {items.map(({ rev, changes }) => (
          <li key={rev.id} className="border-l-2 border-ink-800 pl-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white font-medium">
                {rev.editor ? getDisplayName(rev.editor) : 'Onbekend'}
              </span>
              <span className="text-xs text-ink-500">{fmtDateTime(rev.edited_at)}</span>
            </div>
            <p className="text-xs text-ink-400 mt-0.5">
              Gewijzigd: <span className="text-ink-300">{changes.join(', ')}</span>
            </p>
            <details className="mt-2">
              <summary className="text-xs text-brand-400 cursor-pointer hover:text-brand-300 list-none">
                Deze versie bekijken
              </summary>
              <div className="mt-2 rounded-lg border border-ink-800 bg-ink-900/40 p-4">
                <p className="text-sm text-white font-medium">{rev.title}</p>
                <p className="text-xs text-ink-500 mt-0.5 capitalize">
                  {fmtDate(rev.meeting_date)}{!rev.published && ' · concept'}
                </p>
                {rev.attendees && rev.attendees.trim() && (
                  <p className="text-xs text-ink-400 mt-2">
                    <span className="uppercase tracking-wide text-ink-500">Aanwezigen: </span>
                    <span className="whitespace-pre-wrap">{rev.attendees}</span>
                  </p>
                )}
                {rev.content.replace(/<[^>]*>/g, '').trim() && (
                  <div
                    className="rich-content text-sm mt-3"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(rev.content) }}
                  />
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
