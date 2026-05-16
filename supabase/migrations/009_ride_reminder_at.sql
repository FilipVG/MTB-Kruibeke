ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz;
