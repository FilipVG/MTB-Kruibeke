-- Review-herinneringen: deelnemers krijgen ~8u na de start van een rit een mail
-- met de vraag een review achter te laten.

-- Voorkeur per lid (standaard aan), naar analogie met email_reminders.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS review_reminders boolean NOT NULL DEFAULT true;

-- Markeert of/wanneer de review-herinnering voor een rit al verstuurd is,
-- zodat de cron elke rit hoogstens één keer oppikt.
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS review_reminder_sent_at timestamptz;
