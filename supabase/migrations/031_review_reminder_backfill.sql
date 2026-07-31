-- Voorkom dat de review-cron met terugwerkende kracht mails verstuurt voor
-- ritten uit het verleden. Alle ritten die nu al gestart zijn, worden als
-- 'verwerkt' gemarkeerd (review_reminder_sent_at gevuld), zodat de cron ze
-- nooit oppikt. Enkel ritten die daarna nog moeten plaatsvinden krijgen
-- voortaan een review-herinnering.
--
-- Idempotent: raakt enkel rijen aan waar de vlag nog leeg is.

UPDATE public.rides
  SET review_reminder_sent_at = now()
  WHERE start_at <= now()
    AND review_reminder_sent_at IS NULL;
