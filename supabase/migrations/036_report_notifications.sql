-- Leden verwittigen bij een nieuw gepubliceerd verslag.
-- Nieuwe profielvoorkeur (standaard aan) + markering op het verslag zodat de
-- dagelijkse cron elk verslag hoogstens één keer meldt.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS report_notifications boolean NOT NULL DEFAULT true;

ALTER TABLE public.meeting_reports
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- Backfill: reeds gepubliceerde verslagen niet met terugwerkende kracht mailen.
UPDATE public.meeting_reports
  SET notified_at = now()
  WHERE published = true AND notified_at IS NULL;
