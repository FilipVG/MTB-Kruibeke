-- Enforce: predictions can only be inserted/updated before match starts

DROP POLICY IF EXISTS "wk2026_pred_insert" ON wk2026_predictions;
DROP POLICY IF EXISTS "wk2026_pred_update" ON wk2026_predictions;

CREATE POLICY "wk2026_pred_insert" ON wk2026_predictions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM wk2026_matches WHERE id = match_id AND start_at > now())
  );

CREATE POLICY "wk2026_pred_update" ON wk2026_predictions FOR UPDATE
  USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM wk2026_matches WHERE id = match_id AND start_at > now())
  )
  WITH CHECK (user_id = auth.uid());
