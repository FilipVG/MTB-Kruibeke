-- ============================================================
-- Newsletter: wants_newsletter op profiles + newsletter_runs log
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_newsletter boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.newsletter_runs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at          timestamptz NOT NULL DEFAULT now(),
  sent_by          uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_count  int         NOT NULL DEFAULT 0,
  test_mode        boolean     NOT NULL DEFAULT true,
  new_item_count   int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins kunnen nieuwsbrieflog lezen en schrijven"
  ON public.newsletter_runs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
