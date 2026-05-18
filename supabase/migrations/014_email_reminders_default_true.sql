-- Nieuwe leden ontvangen standaard rituitnodigingen
ALTER TABLE public.profiles
  ALTER COLUMN email_reminders SET DEFAULT true;
