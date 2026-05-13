import { Trophy, Medal } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getInitials, getDisplayName, cn } from '@/lib/utils';
import type { RankingEntry } from '@/lib/types/database';

export const metadata = { title: 'Klassement — MTB Kruibeke' };
export const dynamic = 'force-dynamic';

export default async function KlassementPage() {
  const supabase = await createClient();
  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')
    .order('total_points', { ascending: false });

  const entries = (ranking ?? []) as RankingEntry[];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white flex items-center gap-3">
          <Trophy className="h-7 w-7 text-brand-500" />
          Puntenklassement
        </h1>
        <p className="text-sm text-ink-400 mt-2">
          Punten worden toegekend voor deelname aan ritten die in het klassement opgenomen zijn.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">
          Nog geen klassement beschikbaar.
        </div>
      ) : (
        <>
          {/* Podium */}
          {podium.length === 3 && (
            <div className="grid grid-cols-3 gap-3 mb-10 items-end">
              {[podium[1], podium[0], podium[2]].map((entry, i) => {
                const place = i === 1 ? 1 : i === 0 ? 2 : 3;
                const heights = { 1: 'h-44', 2: 'h-36', 3: 'h-28' } as const;
                const colors = {
                  1: 'bg-brand-700 border-brand-500',
                  2: 'bg-ink-800 border-ink-600',
                  3: 'bg-amber-900/50 border-amber-700/50',
                } as const;
                return (
                  <div key={entry.id} className="text-center">
                    <Avatar entry={entry} size="lg" />
                    <p className="mt-2 text-sm font-medium text-white truncate">{getDisplayName(entry)}</p>
                    <p className="text-xs text-ink-400">{entry.total_points} pt</p>
                    <div className={cn(
                      'mt-2 rounded-t-md border-t-2 flex items-center justify-center text-white text-3xl font-semibold',
                      heights[place as 1 | 2 | 3],
                      colors[place as 1 | 2 | 3]
                    )}>
                      {place}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest van de tabel */}
          <div className="card divide-y divide-ink-800">
            {(podium.length < 3 ? entries : rest).map((entry, idx) => {
              const place = podium.length < 3 ? idx + 1 : idx + 4;
              return (
                <div key={entry.id} className="flex items-center gap-4 p-3 sm:p-4">
                  <span className="w-8 text-center text-sm font-medium text-ink-400">
                    {place}
                  </span>
                  <Avatar entry={entry} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{getDisplayName(entry)}</p>
                    <p className="text-xs text-ink-500">
                      {entry.rides_attended} rit{entry.rides_attended !== 1 && 'ten'}
                    </p>
                  </div>
                  <span className="text-base font-semibold text-brand-300">{entry.total_points}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ entry, size }: { entry: RankingEntry; size: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-16 w-16 text-base' : 'h-9 w-9 text-xs';
  if (entry.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={entry.avatar_url} alt="" className={cn(cls, 'rounded-full object-cover mx-auto')} />
    );
  }
  return (
    <div className={cn(cls, 'rounded-full bg-brand-700 flex items-center justify-center font-medium text-white mx-auto')}>
      {getInitials(entry)}
    </div>
  );
}
