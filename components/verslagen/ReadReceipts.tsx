import { Eye } from 'lucide-react';
import { getDisplayName } from '@/lib/utils';
import type { MeetingReportRead, Profile } from '@/lib/types/database';

type ReadWithReader = MeetingReportRead & {
  reader: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name'> | null;
};

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function ReadReceipts({ reads, totalMembers }: { reads: ReadWithReader[]; totalMembers: number }) {
  const sorted = [...reads].sort(
    (a, b) => new Date(a.first_opened_at).getTime() - new Date(b.first_opened_at).getTime(),
  );

  return (
    <section className="card p-6 mt-6">
      <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
        <Eye className="h-4 w-4 text-ink-400" />
        Gelezen door
      </h2>
      <p className="text-sm text-ink-400 mb-4">
        {sorted.length} van {totalMembers} {totalMembers === 1 ? 'lid' : 'leden'} heeft dit verslag geopend.
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink-500">Nog niemand heeft dit verslag geopend.</p>
      ) : (
        <ul className="divide-y divide-ink-800/60">
          {sorted.map(read => (
            <li key={read.user_id} className="flex items-center justify-between gap-4 py-2.5 flex-wrap">
              <span className="text-sm text-white">
                {read.reader ? getDisplayName(read.reader) : 'Onbekend'}
              </span>
              <div className="text-xs text-ink-400 text-right">
                <span>Eerste: {fmtDateTime(read.first_opened_at)}</span>
                {read.open_count > 1 && (
                  <span className="ml-3">
                    Laatste: {fmtDateTime(read.last_opened_at)} · {read.open_count}× geopend
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
