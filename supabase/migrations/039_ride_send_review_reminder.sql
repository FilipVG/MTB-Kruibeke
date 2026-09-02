-- Per rit instelbaar of er een review-mail verstuurd wordt na afloop.
-- Reviews blijven altijd mogelijk op de site; dit veld stuurt enkel de mail aan/uit.
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS send_review_reminder boolean NOT NULL DEFAULT true;
