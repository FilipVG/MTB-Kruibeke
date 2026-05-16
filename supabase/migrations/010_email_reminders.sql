-- Voorkeur e-mailherinneringen per lid
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reminders boolean NOT NULL DEFAULT false;

-- Bijhouden wanneer de herinnering verstuurd is
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
