export type WK2026Phase = 'groep' | 'zestiende' | 'achtste' | 'kwart' | 'halve' | 'finale';

export interface WK2026Match {
  id: string;
  phase: WK2026Phase;
  opponent: string;
  is_belgium_home: boolean;
  start_at: string;
  location: string | null;
  belgium_score: number | null;
  opponent_score: number | null;
  created_at: string;
}

export interface WK2026Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_belgium: number;
  predicted_opponent: number;
  joker: boolean;
  created_at: string;
  updated_at: string;
}

export interface WK2026PredictionWithProfile extends WK2026Prediction {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}
