import type { WK2026Phase } from './types';

export const PHASE_POINTS: Record<WK2026Phase, { result: number; score: number }> = {
  groep:   { result: 3, score: 5 },
  achtste: { result: 4, score: 7 },
  kwart:   { result: 5, score: 9 },
  halve:   { result: 6, score: 11 },
  finale:  { result: 7, score: 13 },
};

export const PHASE_LABELS: Record<WK2026Phase, string> = {
  groep:   'Groepsfase',
  achtste: '1/8 finale',
  kwart:   '1/4 finale',
  halve:   '1/2 finale',
  finale:  'Finale',
};

export const OPPONENT_FLAGS: Record<string, string> = {
  'Egypte': '🇪🇬',
  'Iran': '🇮🇷',
  'Nieuw-Zeeland': '🇳🇿',
};

type MatchResult = 'win' | 'draw' | 'loss';

function getResult(belgium: number, opponent: number): MatchResult {
  if (belgium > opponent) return 'win';
  if (belgium < opponent) return 'loss';
  return 'draw';
}

export function calcPoints(
  phase: WK2026Phase,
  actualBelgium: number,
  actualOpponent: number,
  predictedBelgium: number,
  predictedOpponent: number,
  joker: boolean,
): { points: number; correctResult: boolean; correctScore: boolean } {
  const pts = PHASE_POINTS[phase];
  const correctScore =
    predictedBelgium === actualBelgium && predictedOpponent === actualOpponent;
  const correctResult =
    correctScore ||
    getResult(predictedBelgium, predictedOpponent) === getResult(actualBelgium, actualOpponent);

  let raw = 0;
  if (correctScore) raw = pts.score;
  else if (correctResult) raw = pts.result;

  return { points: joker ? raw * 2 : raw, correctResult, correctScore };
}

export function formatMatchTitle(opponent: string, isBelgiumHome: boolean): string {
  return isBelgiumHome ? `België — ${opponent}` : `${opponent} — België`;
}
