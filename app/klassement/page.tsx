import { Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getInitials, getDisplayName, cn } from '@/lib/utils';
import type { RankingEntry } from '@/lib/types/database';

export const metadata = { title: 'Klassement — MTB Kruibeke' };

interface Props {
  searchParams: Promise<{ jaar?: string }>;
}

export default async function KlassementPage({ searchParams }: Props) {
  const params = await searchParams;
  const huidigJaar = new Date().getFullYear();

  const supabase = await createClient();

  const { data: jarenData } = await supabase.rpc('get_ranking_years');
  const jaren: number[] = (jarenData ?? []).map((r: { jaar: number }) => r.jaar);

  const defaultJaar = jaren[0] ?? huidigJaar;
  const jaar = jaren.includes(parseInt(params.jaar ?? ''))
    ? parseInt(params.jaar!)
    : defaultJaar;

  const { data: ranking } = await supabase.rpc('get_ranking', { p_year: jaar });

  const entries = (ranking ?? []) as RankingEntry[];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white flex items-center gap-3">
            <Trophy className="h-7 w-7 text-brand-500" />
            Puntenklassement
          </h1>
          <p className="text-sm text-ink-400 mt-2">
            Punten worden toegekend voor deelname aan ritten die in het klassement opgenomen zijn.
          </p>
        </div>

        {/* Jaarselector */}
        <div className="flex items-center gap-2 shrink-0">
          {jaren.map(j => (
            <a
              key={j}
              href={`?jaar=${j}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition',
                j === jaar
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-400 hover:text-white hover:bg-ink-800'
              )}
            >
              {j}
            </a>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">
          Geen klassement beschikbaar voor {jaar}.
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
                  1: 'bg-yellow-500/20 border-yellow-400',
                  2: 'bg-slate-400/20 border-slate-300',
                  3: 'bg-orange-700/20 border-orange-600',
                } as const;
                return (
                  <div key={entry.id} className="text-center">
                    <Avatar entry={entry} size="lg" />
                    <p className="mt-2 text-sm font-medium text-white truncate">{getDisplayName(entry)}</p>
                    <p className={cn('text-xs font-medium', place === 1 ? 'text-yellow-400' : place === 2 ? 'text-slate-300' : 'text-orange-500')}>
                      {entry.total_points} pt
                    </p>
                    <p className="text-xs text-ink-500">
                      {entry.rides_attended} rit{entry.rides_attended !== 1 && 'ten'}
                    </p>
                    <div className={cn(
                      'mt-2 rounded-t-md border-t-2 flex items-center justify-center text-3xl font-semibold',
                      heights[place as 1 | 2 | 3],
                      colors[place as 1 | 2 | 3],
                      place === 1 ? 'text-yellow-300' : place === 2 ? 'text-slate-300' : 'text-orange-400'
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
