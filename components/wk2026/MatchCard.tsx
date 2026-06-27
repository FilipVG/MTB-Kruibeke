'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calcPoints, PHASE_LABELS, OPPONENT_FLAGS } from '@/lib/wk2026/points';
import type { WK2026Match, WK2026Prediction, WK2026PredictionWithProfile } from '@/lib/wk2026/types';
import { getDisplayName, formatShortDateTime } from '@/lib/utils';
import { Check, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  match: WK2026Match;
  formattedStartAt: string;
  myPrediction: WK2026Prediction | null;
  allPredictions: WK2026PredictionWithProfile[];
  jokerMatchId: string | null;
  jokerLocked: boolean;
  userId: string;
  hasStarted: boolean;
}

function useCountdown(startAt: string, initiallyStarted: boolean) {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [started, setStarted] = useState(initiallyStarted);

  useEffect(() => {
    if (initiallyStarted) return;
    const target = new Date(startAt).getTime();

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setStarted(true);
        setCountdown(null);
        return;
      }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(
        d > 0 ? `${d}d ${h}u ${m}m ${s}s`
          : h > 0 ? `${h}u ${m}m ${s}s`
          : `${m}m ${s}s`,
      );
    }

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [startAt, initiallyStarted]);

  return { countdown, started };
}

export function MatchCard({
  match,
  formattedStartAt,
  myPrediction,
  allPredictions,
  jokerMatchId,
  jokerLocked,
  userId,
  hasStarted,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [, startTransition] = useTransition();

  const { countdown, started } = useCountdown(match.start_at, hasStarted);

  const [belgiumVal, setBelgiumVal] = useState(myPrediction?.predicted_belgium?.toString() ?? '');
  const [opponentVal, setOpponentVal] = useState(myPrediction?.predicted_opponent?.toString() ?? '');
  const [useJoker, setUseJoker] = useState(myPrediction?.joker ?? false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Sync local joker toggle with server state after a refresh (e.g. when the
  // joker moved to another match). myPrediction.joker only changes after a save,
  // so this never clobbers an in-progress toggle.
  useEffect(() => {
    setUseJoker(myPrediction?.joker ?? false);
  }, [myPrediction?.joker]);

  const flag = OPPONENT_FLAGS[match.opponent] ?? '🏳️';
  const hasScore = match.belgium_score !== null && match.opponent_score !== null;

  const jokerOnOtherStarted = jokerLocked && jokerMatchId !== match.id;
  const jokerOnOtherUnstarted = !jokerLocked && jokerMatchId !== null && jokerMatchId !== match.id;

  async function save() {
    if (started) return;
    const b = parseInt(belgiumVal);
    const o = parseInt(opponentVal);
    if (isNaN(b) || isNaN(o) || b < 0 || o < 0) {
      setMsg('Geef een geldige score in (0 of hoger).');
      return;
    }
    setSaving(true);
    setMsg(null);

    // Setting joker here automatically clears any other joker (DB trigger
    // wk2026_enforce_single_joker guarantees at most one joker per user).
    const { error } = await supabase.from('wk2026_predictions').upsert(
      { user_id: userId, match_id: match.id, predicted_belgium: b, predicted_opponent: o, joker: useJoker },
      { onConflict: 'user_id,match_id' },
    );

    setSaving(false);
    if (error) { setMsg('Opslaan mislukt: ' + error.message); return; }
    setMsg('Opgeslagen!');
    startTransition(() => router.refresh());
    setTimeout(() => setMsg(null), 2000);
  }

  const myPoints = hasScore && myPrediction
    ? calcPoints(match.phase, match.belgium_score!, match.opponent_score!, myPrediction.predicted_belgium, myPrediction.predicted_opponent, myPrediction.joker)
    : null;

  const predStr = myPrediction
    ? match.is_belgium_home
      ? `${myPrediction.predicted_belgium} — ${myPrediction.predicted_opponent}`
      : `${myPrediction.predicted_opponent} — ${myPrediction.predicted_belgium}`
    : null;

  return (
    <div className="rounded-xl border border-ink-800 overflow-hidden" style={{ background: '#0d0d0d' }}>
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'linear-gradient(90deg, #1a0000 0%, #2d0000 100%)', borderBottom: '1px solid #3d0000' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: '#D32011', color: '#fff' }}>
            {PHASE_LABELS[match.phase]}
          </span>
          <span className="text-ink-400 text-xs">{formattedStartAt}{match.location && ` • ${match.location}`}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasScore && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-900/40 text-green-300 border border-green-800">Gespeeld</span>
          )}
          {!hasScore && started && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-800">Bezig</span>
          )}
          {started && (
            <span className="flex items-center gap-1 text-xs text-ink-500">
              <Lock className="h-3 w-3" />
              Vergrendeld
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Teams + score — volgorde volgt thuis/uit (uitmatch: tegenstander links) */}
        {(() => {
          const belgiumTeam = (
            <div className="text-center">
              <div className="text-3xl mb-1">🇧🇪</div>
              <div className="text-sm font-semibold text-white">België</div>
            </div>
          );
          const opponentTeam = (
            <div className="text-center">
              <div className="text-3xl mb-1">{flag}</div>
              <div className="text-sm font-semibold text-white">{match.opponent}</div>
            </div>
          );
          const scoreBlock = hasScore ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-white tabular-nums">
                {match.is_belgium_home
                  ? `${match.belgium_score} — ${match.opponent_score}`
                  : `${match.opponent_score} — ${match.belgium_score}`}
              </div>
              <div className="text-xs text-ink-500 mt-1">Eindstand</div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-ink-600">—</div>
          );
          return (
            <div className="flex items-center justify-center gap-6 mb-5">
              {match.is_belgium_home ? belgiumTeam : opponentTeam}
              {scoreBlock}
              {match.is_belgium_home ? opponentTeam : belgiumTeam}
            </div>
          );
        })()}

        {/* Countdown */}
        {!started && countdown && (
          <div className="flex justify-center mb-5">
            <div className="rounded-lg px-4 py-2 text-center" style={{ background: '#1a0a00', border: '1px solid #4d1a00' }}>
              <p className="text-xs text-ink-500 mb-0.5 uppercase tracking-wide">Aftrap over</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: '#F0BC00' }}>{countdown}</p>
            </div>
          </div>
        )}

        {/* Prediction area */}
        {!started ? (
          /* Editable form */
          <div className="rounded-lg border border-ink-800 p-4 space-y-4" style={{ background: '#111' }}>
            <p className="text-sm font-medium text-ink-300">Jouw voorspelling</p>
            <div className="flex items-center justify-center gap-3">
              {(() => {
                const belgiumInput = (
                  <div className="text-center">
                    <div className="text-xs text-ink-500 mb-1">🇧🇪 België</div>
                    <input type="number" min="0" max="20" className="input w-16 text-center text-lg font-bold" value={belgiumVal} onChange={e => setBelgiumVal(e.target.value)} placeholder="0" />
                  </div>
                );
                const opponentInput = (
                  <div className="text-center">
                    <div className="text-xs text-ink-500 mb-1">{flag} {match.opponent}</div>
                    <input type="number" min="0" max="20" className="input w-16 text-center text-lg font-bold" value={opponentVal} onChange={e => setOpponentVal(e.target.value)} placeholder="0" />
                  </div>
                );
                return (
                  <>
                    {match.is_belgium_home ? belgiumInput : opponentInput}
                    <span className="text-2xl font-bold text-ink-600 mt-4">—</span>
                    {match.is_belgium_home ? opponentInput : belgiumInput}
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => { if (!jokerOnOtherStarted) setUseJoker(v => !v); }}
                disabled={jokerOnOtherStarted}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition',
                  useJoker ? 'text-black font-bold' :
                  jokerOnOtherStarted ? 'bg-ink-900 text-ink-600 cursor-not-allowed border border-ink-800' :
                  'bg-ink-900 text-ink-300 border border-ink-700 hover:border-yellow-600',
                )}
                style={useJoker ? { background: '#F0BC00' } : {}}
                title={jokerOnOtherStarted ? 'Joker vergrendeld op gestarte wedstrijd' : 'Zet joker in (verdubbelt punten)'}
              >
                🃏 Joker{useJoker ? ' actief' : jokerOnOtherUnstarted ? ' (verplaatsen)' : ''}
              </button>

              <div className="flex items-center gap-2">
                {msg && <span className={`text-xs ${msg.startsWith('Opgeslagen') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
                <button onClick={save} disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Opslaan…' : 'Opslaan'}
                </button>
              </div>
            </div>
            {jokerOnOtherStarted && <p className="text-xs text-ink-500">Je joker is vergrendeld op een wedstrijd die al gestart is.</p>}
          </div>
        ) : (
          /* Read-only prediction */
          <div className={cn(
            'rounded-lg border p-4 mb-4',
            myPoints?.correctScore ? 'border-green-700 bg-green-900/20'
              : myPoints?.correctResult ? 'border-yellow-700 bg-yellow-900/20'
              : hasScore ? 'border-red-900 bg-red-950/20'
              : 'border-ink-800 bg-ink-900/20',
          )}>
            {myPrediction ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-ink-400 mb-1 flex items-center gap-2">
                    Jouw voorspelling
                    {myPrediction.joker && <span>🃏 <span style={{ color: '#F0BC00' }}>Joker</span></span>}
                    <Lock className="h-3 w-3 text-ink-600" />
                  </p>
                  <p className="text-xl font-bold text-white tabular-nums">{predStr}</p>
                </div>
                {myPoints !== null && (
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {myPoints.correctScore && <Check className="h-4 w-4 text-green-400" />}
                      {!myPoints.correctScore && myPoints.correctResult && <Check className="h-4 w-4 text-yellow-400" />}
                      {!myPoints.correctResult && hasScore && <X className="h-4 w-4 text-red-400" />}
                      <span className={cn('text-2xl font-bold',
                        myPoints.correctScore ? 'text-green-400'
                          : myPoints.correctResult ? 'text-yellow-400'
                          : 'text-red-400',
                      )}>
                        {myPoints.points} pt
                      </span>
                    </div>
                    <p className="text-xs text-ink-500">
                      {myPoints.correctScore ? 'Juiste score!' : myPoints.correctResult ? 'Juist resultaat' : 'Geen punten'}
                      {myPrediction.joker && myPoints.points > 0 ? ' × 2 🃏' : ''}
                    </p>
                  </div>
                )}
                {!hasScore && <p className="text-xs text-ink-500">Wacht op eindstand…</p>}
              </div>
            ) : (
              <p className="text-sm text-ink-500 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Geen voorspelling ingegeven voor deze wedstrijd.
              </p>
            )}
          </div>
        )}

        {/* All predictions table (after start) */}
        {started && allPredictions.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-2">Alle voorspellingen ({allPredictions.length})</p>
            <div className="rounded-lg border border-ink-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-800 bg-ink-900/50">
                    <th className="text-left px-3 py-2 text-ink-500 font-medium text-xs">Lid</th>
                    <th className="text-center px-3 py-2 text-ink-500 font-medium text-xs">Voorspelling</th>
                    <th className="text-center px-3 py-2 text-ink-500 font-medium text-xs">Score</th>
                    <th className="text-center px-3 py-2 text-ink-500 font-medium text-xs">Joker</th>
                    <th className="text-right px-3 py-2 text-ink-500 font-medium text-xs">Punten</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/50">
                  {allPredictions
                    .map(pred => {
                      const pts = hasScore
                        ? calcPoints(match.phase, match.belgium_score!, match.opponent_score!, pred.predicted_belgium, pred.predicted_opponent, pred.joker)
                        : null;
                      const pStr = match.is_belgium_home
                        ? `${pred.predicted_belgium}–${pred.predicted_opponent}`
                        : `${pred.predicted_opponent}–${pred.predicted_belgium}`;
                      return { pred, pts, pStr };
                    })
                    .sort((a, b) => (b.pts?.points ?? 0) - (a.pts?.points ?? 0))
                    .map(({ pred, pts, pStr }) => (
                      <tr key={pred.id} className={cn('transition', pred.user_id === userId ? 'bg-brand-900/20' : 'hover:bg-ink-900/30')}>
                        <td className="px-3 py-2.5 text-ink-200">
                          {getDisplayName(pred.profile)}
                          {pred.user_id === userId && <span className="ml-1 text-xs text-ink-500">(jij)</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-white">{pStr}</td>
                        <td className="px-3 py-2.5 text-center">
                          {pts?.correctScore ? <span className="text-green-400 font-medium text-xs">✓ score</span>
                            : pts?.correctResult ? <span className="text-yellow-400 text-xs">✓ resultaat</span>
                            : hasScore ? <span className="text-ink-600">✗</span>
                            : <span className="text-ink-600">–</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {pred.joker
                            ? <span title={`Joker ingezet op ${formatShortDateTime(pred.updated_at)}`}>🃏</span>
                            : <span className="text-ink-700">–</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold">
                          {pts !== null
                            ? <span className={pts.points > 0 ? 'text-white' : 'text-ink-600'}>{pts.points} pt</span>
                            : <span className="text-ink-600">–</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
