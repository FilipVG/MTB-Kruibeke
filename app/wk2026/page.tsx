import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { MatchCard } from '@/components/wk2026/MatchCard';
import Link from 'next/link';
import { Trophy, BookOpen } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/utils';
import type { WK2026Match, WK2026Prediction, WK2026PredictionWithProfile } from '@/lib/wk2026/types';

export const metadata = { title: 'WK 2026 Pronostiek — MTB Kruibeke' };

export default async function WK2026Page() {
  const current = await getCurrentUser();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: matches }, { data: myPredictions }] = await Promise.all([
    supabase.from('wk2026_matches').select('*').order('start_at', { ascending: true }),
    supabase.from('wk2026_predictions').select('*').eq('user_id', current!.user.id),
  ]);

  const startedMatchIds = ((matches ?? []) as WK2026Match[])
    .filter(m => m.start_at <= now)
    .map(m => m.id);

  let allPredictions: WK2026PredictionWithProfile[] = [];
  if (startedMatchIds.length > 0) {
    const { data } = await supabase
      .from('wk2026_predictions')
      .select('*, profile:profiles(id, first_name, last_name, nickname, avatar_url)')
      .in('match_id', startedMatchIds);
    allPredictions = (data ?? []) as WK2026PredictionWithProfile[];
  }

  const preds = (myPredictions ?? []) as WK2026Prediction[];
  const myJoker = preds.find(p => p.joker);
  const jokerMatchId = myJoker?.match_id ?? null;
  const jokerMatch = jokerMatchId
    ? ((matches ?? []) as WK2026Match[]).find(m => m.id === jokerMatchId)
    : undefined;
  const jokerLocked = jokerMatch ? jokerMatch.start_at <= now : false;

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0000 0%, #1f0000 50%, #3d0808 100%)' }}>
        {/* Flag stripe decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-black" />
          <div className="flex-1" style={{ background: '#F0BC00' }} />
          <div className="flex-1" style={{ background: '#D32011' }} />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🇧🇪</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0BC00' }}>
              FIFA World Cup 2026
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            Rode Duivels Pronostiek
          </h1>
          <p className="text-red-100/60 mb-6 max-w-lg">
            Voorspel de uitslagen van de Rode Duivels. Voorspellingen zijn aanpasbaar tot aan de aftrap.
            Zet je joker op het juiste moment in.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/wk2026/klassement"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition hover:brightness-110"
              style={{ background: '#F0BC00', color: '#000' }}
            >
              <Trophy className="h-4 w-4" />
              Klassement
            </Link>
            <Link
              href="/wk2026/regels"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-white/20 text-white hover:bg-white/10 transition"
            >
              <BookOpen className="h-4 w-4" />
              Spelregels & puntenverdeling
            </Link>
          </div>
        </div>
      </div>

      {/* Joker status banner */}
      {jokerMatchId && (
        <div className="border-b border-ink-800" style={{ background: '#1a1200' }}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-2 flex items-center gap-2 text-sm">
            <span>🃏</span>
            <span className="text-ink-300">
              Joker ingezet op{' '}
              <span style={{ color: '#F0BC00' }}>
                {((matches ?? []) as WK2026Match[]).find(m => m.id === jokerMatchId)
                  ? `België vs ${((matches ?? []) as WK2026Match[]).find(m => m.id === jokerMatchId)!.opponent}`
                  : 'een wedstrijd'}
              </span>
              {jokerLocked && <span className="text-ink-500"> (vergrendeld)</span>}
              {!jokerLocked && <span className="text-ink-500"> (nog aanpasbaar)</span>}
            </span>
          </div>
        </div>
      )}

      {/* Matches */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-4">
        {((matches ?? []) as WK2026Match[]).length === 0 && (
          <div className="text-center py-16 text-ink-500">Nog geen wedstrijden gepland.</div>
        )}
        {((matches ?? []) as WK2026Match[]).map(match => {
          const hasStarted = match.start_at <= now;
          return (
            <MatchCard
              key={match.id}
              match={match}
              formattedStartAt={formatMatchDateTime(match.start_at)}
              myPrediction={preds.find(p => p.match_id === match.id) ?? null}
              allPredictions={hasStarted ? allPredictions.filter(p => p.match_id === match.id) : []}
              jokerMatchId={jokerMatchId}
              jokerLocked={!!jokerLocked}
              userId={current!.user.id}
              hasStarted={hasStarted}
            />
          );
        })}
      </div>
    </div>
  );
}
