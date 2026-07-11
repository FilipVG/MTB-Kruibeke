-- The single-joker trigger's cleanup UPDATE runs as the calling user
-- (SECURITY INVOKER), so it is itself subject to the wk2026_pred_update RLS
-- policy, which only allows updating predictions for matches that haven't
-- started yet. If a user's joker is on an already-started (locked) match and
-- they set joker=true on a different, still-open match, the cleanup UPDATE
-- silently affects 0 rows for the locked match -- leaving two active jokers
-- and doubling their points on two matches instead of one. The UI already
-- disables the joker toggle in this situation, but that is not enforced at
-- the database level, so it could be bypassed by calling the API directly.
--
-- Fix: reject the new joker assignment outright when the user's existing
-- joker is locked on a started match, instead of silently leaving both set.

CREATE OR REPLACE FUNCTION wk2026_enforce_single_joker()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.joker THEN
    IF EXISTS (
      SELECT 1
        FROM wk2026_predictions p
        JOIN wk2026_matches m ON m.id = p.match_id
        WHERE p.user_id = NEW.user_id
          AND p.id <> NEW.id
          AND p.joker = true
          AND m.start_at <= now()
    ) THEN
      RAISE EXCEPTION 'Joker is al vergrendeld op een gestarte wedstrijd en kan niet meer verplaatst worden.';
    END IF;

    UPDATE wk2026_predictions
      SET joker = false
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
        AND joker = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
