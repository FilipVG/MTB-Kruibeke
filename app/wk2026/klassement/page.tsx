import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { calcPoints, PHASE_LABELS, OPPONENT_FLAGS } from '@/lib/wk2026/points';
import { getDisplayName, formatShortDateTime } from '@/lib/utils';
import type { WK2026Match, WK2026PredictionWithProfile } from '@/lib/wk2026/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'WK 2026 Klassement — MTB Kruibeke' };

export default async function WK2026KlassementPage() {
  const current = await getCurrentUser();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: matches }, { data: allProfiles }] = await Promise.all([
    supabase.from('wk2026_matches').select('*').order('start_at', { ascending: true }),
    supabase.from('profiles').select('id, first_name, last_name, nickname, avatar_url').eq('is_active', true),
  ]);

  const startedMatches = ((matches ?? []) as WK2026Match[]).filter(m => m.start_at <= now);

  let allPredictions: WK2026PredictionWithProfile[] = [];
  if (startedMatches.length > 0) {
    const { data } = await supabase
      .from('wk2026_predictions')
      .select('*, profile:profiles(id, first_name, last_name, nickname, avatar_url)')
      .in('match_id', startedMatches.map(m => m.id));
    allPredictions = (data ?? []) as WK2026PredictionWithProfile[];
  }

  // Build leaderboard
  type Entry = {
    profileId: string;
    name: string;
    avatarUrl: string | null;
    totalPoints: number;
    jokerUsed: boolean;
    jokerOpponent: string | null;
    jokerUsedAt: string | null;
    rows: {
      match: WK2026Match;
      pred: WK2026PredictionWithProfile;
      points: number;
      correctResult: boolean;
      correctScore: boolean;
    }[];
    predCount: number;
  };

  const map = new Map<string, Entry>();

  // Initialize all members
  for (const p of (allProfiles ?? [])) {
    map.set(p.id, {
      profileId: p.id,
      name: getDisplayName(p),
      avatarUrl: p.avatar_url,
      totalPoints: 0,
      jokerUsed: false,
      jokerOpponent: null,
      jokerUsedAt: null,
      rows: [],
      predCount: 0,
    });
  }

  // Fill in predictions
  for (const pred of allPredictions) {
    const match = startedMatches.find(m => m.id === pred.match_id);
    if (!match) continue;
    const entry = map.get(pred.user_id);
    if (!entry) continue;

    let pts = { points: 0, correctResult: false, correctScore: false };
    if (match.belgium_score !== null && match.opponent_score !== null) {
      pts = calcPoints(match.phase, match.belgium_score, match.opponent_score, pred.predicted_belgium, pred.predicted_opponent, pred.joker);
    }

    entry.totalPoints += pts.points;
    entry.predCount++;
    entry.rows.push({ match, pred, ...pts });

    if (pred.joker) {
      entry.jokerUsed = true;
      entry.jokerOpponent = match.opponent;
      entry.jokerUsedAt = pred.updated_at;
    }
  }

  const leaderboard = Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);

  const MEDALS = ['🥇', '🥈', '🥉'];
  const uniquePoints = [...new Set(leaderboard.map(e => e.totalPoints))]
    .filter(p => p > 0)
    .sort((a, b) => b - a);
  const getMedal = (points: number): string | null => {
    const tier = uniquePoints.indexOf(points);
    return tier >= 0 && tier < 3 ? MEDALS[tier] : null;
  };

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0000 0%, #1f0000 50%, #3d0808 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 flex" aria-hidden>
          <div className="flex-1 bg-black" />
          <div className="flex-1" style={{ background: '#F0BC00' }} />
          <div className="flex-1" style={{ background: '#D32011' }} />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
          <Link href="/wk2026" className="inline-flex items-center gap-1 text-sm text-red-200/60 hover:text-white mb-4 transition">
            <ArrowLeft className="h-4 w-4" />
            Terug naar pronostiek
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🇧🇪</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0BC00' }}>FIFA World Cup 2026</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Klassement</h1>
          <p className="text-red-100/50 text-sm mt-1">Punten worden berekend op basis van gespeelde wedstrijden.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-3">
        {leaderboard.length === 0 && (
          <p className="text-ink-500 text-center py-12">Nog geen gegevens beschikbaar.</p>
        )}

        {leaderboard.map((entry, i) => (
          <details key={entry.profileId} className="group rounded-xl border border-ink-800 overflow-hidden" style={{ background: '#0d0d0d' }}>
            <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-ink-900/30 transition list-none">
              {/* Rank */}
              <span className="text-xl w-8 text-center shrink-0">
                {getMedal(entry.totalPoints) ?? <span className="text-ink-500 font-bold text-base">#{i + 1}</span>}
              </span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {entry.name}
                  {entry.profileId === current!.user.id && (
                    <span className="ml-2 text-xs text-ink-500">(jij)</span>
                  )}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {entry.predCount > 0 ? `${entry.predCount} voorspelling${entry.predCount !== 1 ? 'en' : ''}` : 'Geen voorspellingen'}
                </p>
              </div>

              {/* Joker */}
              <div className="text-sm shrink-0 text-right">
                {entry.jokerUsed ? (
                  <div>
                    <span>🃏</span>{' '}
                    <span style={{ color: '#F0BC00' }} className="text-xs font-medium">{entry.jokerOpponent}</span>
                  </div>
                ) : (
                  <span className="text-xs text-ink-600">joker: niet ingezet</span>
                )}
              </div>

              {/* Points */}
              <div className="text-right shrink-0 ml-4">
                <span className="text-2xl font-bold text-white">{entry.totalPoints}</span>
                <span className="text-xs text-ink-500 ml-1">pt</span>
              </div>

              <span className="text-ink-600 group-open:rotate-90 transition-transform shrink-0">›</span>
            </summary>

            {/* Detail rows */}
            <div className="border-t border-ink-800 px-5 py-4">
              {entry.rows.length === 0 ? (
                <p className="text-ink-500 text-sm">Geen voorspellingen voor gespeelde wedstrijden.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-ink-500 uppercase tracking-wide">
                      <th className="text-left pb-2 font-medium">Wedstrijd</th>
                      <th className="text-center pb-2 font-medium">Voorspelling</th>
                      <th className="text-center pb-2 font-medium">Uitslag</th>
                      <th className="text-center pb-2 font-medium">Score</th>
                      <th className="text-right pb-2 font-medium">Punten</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/40">
                    {entry.rows.map(({ match, pred, points, correctResult, correctScore }) => {
                      const flag = OPPONENT_FLAGS[match.opponent] ?? '🏳️';
                      const predStr = match.is_belgium_home
                        ? `${pred.predicted_belgium}–${pred.predicted_opponent}`
                        : `${pred.predicted_opponent}–${pred.predicted_belgium}`;
                      const actualStr = match.belgium_score !== null
                        ? match.is_belgium_home
                          ? `${match.belgium_score}–${match.opponent_score}`
                          : `${match.opponent_score}–${match.belgium_score}`
                        : '?';

                      return (
                        <tr key={match.id}>
                          <td className="py-2.5 text-ink-300">
                            <span className="mr-1">🇧🇪</span>vs {flag} {match.opponent}
                            <span className="ml-2 text-xs text-ink-600">{PHASE_LABELS[match.phase]}</span>
                          </td>
                          <td className="py-2.5 text-center font-mono text-white">
                            {predStr}
                            {pred.joker && <span className="ml-1" title={`Joker ingezet op ${formatShortDateTime(pred.updated_at)}`}>🃏</span>}
                          </td>
                          <td className="py-2.5 text-center font-mono text-ink-300">{actualStr}</td>
                          <td className="py-2.5 text-center">
                            {correctScore ? (
                              <span className="text-green-400 text-xs font-medium">✓ score</span>
                            ) : correctResult ? (
                              <span className="text-yellow-400 text-xs">✓ resultaat</span>
                            ) : match.belgium_score !== null ? (
                              <span className="text-red-400 text-xs">✗</span>
                            ) : (
                              <span className="text-ink-600 text-xs">–</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-bold">
                            <span className={points > 0 ? 'text-white' : 'text-ink-600'}>
                              {points} pt
                              {pred.joker && points > 0 && <span className="text-xs ml-0.5" style={{ color: '#F0BC00' }}>×2</span>}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-ink-700">
                      <td colSpan={4} className="pt-3 text-sm text-ink-400 font-medium">Totaal</td>
                      <td className="pt-3 text-right text-white font-bold">{entry.totalPoints} pt</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
