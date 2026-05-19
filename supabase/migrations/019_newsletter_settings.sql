-- Eén rij met persistente nieuwsbriefinstellingen (intro-tekst)
CREATE TABLE IF NOT EXISTS public.newsletter_settings (
  id          int         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  intro_text  text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins kunnen nieuwsbriefinstellingen beheren"
  ON public.newsletter_settings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Standaardrij aanmaken
INSERT INTO public.newsletter_settings (id, intro_text)
VALUES (1, '')
ON CONFLICT DO NOTHING;
