-- Guarantee at most one joker per user, atomically.
-- When a prediction is saved with joker = true, unset the joker on all
-- other predictions of that same user in the same transaction.

CREATE OR REPLACE FUNCTION wk2026_enforce_single_joker()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.joker THEN
    UPDATE wk2026_predictions
      SET joker = false
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
        AND joker = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wk2026_single_joker
  BEFORE INSERT OR UPDATE OF joker ON wk2026_predictions
  FOR EACH ROW
  WHEN (NEW.joker = true)
  EXECUTE FUNCTION wk2026_enforce_single_joker();

-- Repair any pre-existing inconsistency: keep only the most recently
-- updated joker per user, unset the rest.
UPDATE wk2026_predictions p
  SET joker = false
  WHERE joker = true
    AND id <> (
      SELECT id FROM wk2026_predictions q
      WHERE q.user_id = p.user_id AND q.joker = true
      ORDER BY q.updated_at DESC, q.id DESC
      LIMIT 1
    );
