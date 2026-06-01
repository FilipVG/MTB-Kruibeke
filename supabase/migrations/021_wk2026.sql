-- WK 2026 Pronostiek module

CREATE TYPE wk2026_phase AS ENUM ('groep', 'achtste', 'kwart', 'halve', 'finale');

-- Singleton settings row
CREATE TABLE wk2026_settings (
  id      boolean PRIMARY KEY DEFAULT true,
  active  boolean NOT NULL DEFAULT true,
  CONSTRAINT singleton CHECK (id = true)
);
INSERT INTO wk2026_settings VALUES (true, true);

-- Matches (Belgium only)
CREATE TABLE wk2026_matches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase            wk2026_phase NOT NULL DEFAULT 'groep',
  opponent         text NOT NULL,
  is_belgium_home  boolean NOT NULL DEFAULT true,
  start_at         timestamptz NOT NULL,
  location         text,
  belgium_score    integer,
  opponent_score   integer,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- User predictions
CREATE TABLE wk2026_predictions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id           uuid NOT NULL REFERENCES wk2026_matches(id) ON DELETE CASCADE,
  predicted_belgium  integer NOT NULL,
  predicted_opponent integer NOT NULL,
  joker              boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_wk2026_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wk2026_predictions_updated_at
  BEFORE UPDATE ON wk2026_predictions
  FOR EACH ROW EXECUTE FUNCTION update_wk2026_updated_at();

-- RLS
ALTER TABLE wk2026_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wk2026_matches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wk2026_predictions ENABLE ROW LEVEL SECURITY;

-- Settings: anyone reads, admin writes
CREATE POLICY "wk2026_settings_read"  ON wk2026_settings FOR SELECT USING (true);
CREATE POLICY "wk2026_settings_write" ON wk2026_settings FOR UPDATE
  USING      ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Matches: anyone reads, admin writes
CREATE POLICY "wk2026_matches_read"   ON wk2026_matches FOR SELECT USING (true);
CREATE POLICY "wk2026_matches_insert" ON wk2026_matches FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "wk2026_matches_update" ON wk2026_matches FOR UPDATE
  USING      ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "wk2026_matches_delete" ON wk2026_matches FOR DELETE
  USING      ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Predictions: own always, others after match starts, admin all
CREATE POLICY "wk2026_pred_select_own" ON wk2026_predictions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "wk2026_pred_select_started" ON wk2026_predictions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wk2026_matches m WHERE m.id = match_id AND m.start_at <= now()
  ));
CREATE POLICY "wk2026_pred_insert" ON wk2026_predictions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "wk2026_pred_update" ON wk2026_predictions FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "wk2026_pred_admin" ON wk2026_predictions FOR ALL
  USING      ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Seed Belgium group stage (stored in UTC; CEST = UTC+2)
-- Egypte: 15 juni 21:00 CEST | Iran: 21 juni 21:00 CEST | Nieuw-Zeeland: 27 juni 05:00 CEST
INSERT INTO wk2026_matches (phase, opponent, is_belgium_home, start_at, location) VALUES
  ('groep', 'Egypte',         true,  '2026-06-15 19:00:00+00', 'Seattle'),
  ('groep', 'Iran',           true,  '2026-06-21 19:00:00+00', 'Los Angeles'),
  ('groep', 'Nieuw-Zeeland',  false, '2026-06-27 03:00:00+00', 'Vancouver');
