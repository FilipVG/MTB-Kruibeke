-- De nieuwsbrief bepaalt via rides.updated_at of een rit als GEWIJZIGD geldt.
-- De generieke set_updated_at-trigger schuift die kolom bij élke update op, dus
-- ook wanneer de cron enkel de mail-administratie bijwerkt (reminder_sent_at,
-- review_reminder_sent_at, update_pending). Een rit die enkel gemaild werd,
-- verscheen daardoor onterecht als gewijzigd.
--
-- Deze trigger negeert die drie kolommen: verandert er verder niets aan de rit,
-- dan blijft updated_at staan. Elke inhoudelijke wijziging (titel, datum, type,
-- punten, afgelast, ...) schuift updated_at gewoon op zoals voorheen.

CREATE OR REPLACE FUNCTION public.rides_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  -- Kopie van de nieuwe rij waarin de administratieve kolommen teruggezet zijn
  -- op hun oude waarde. Verschilt die kopie niet van OLD, dan is er inhoudelijk
  -- niets veranderd.
  candidate public.rides := NEW;
BEGIN
  candidate.reminder_sent_at        := OLD.reminder_sent_at;
  candidate.review_reminder_sent_at := OLD.review_reminder_sent_at;
  candidate.update_pending          := OLD.update_pending;
  candidate.updated_at              := OLD.updated_at;

  IF candidate IS DISTINCT FROM OLD THEN
    NEW.updated_at := now();
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rides_updated_at ON public.rides;
CREATE TRIGGER rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.rides_set_updated_at();
