-- Vergaderverslagen: door admins beheerd, zichtbaar voor ingelogde leden.
-- Inhoud is HTML uit de WYSIWYG-editor; optioneel een PDF-bijlage.

CREATE TABLE IF NOT EXISTS public.meeting_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  meeting_date   date NOT NULL,
  content        text NOT NULL DEFAULT '',       -- HTML uit de editor
  attachment_url text,                           -- optionele PDF
  published      boolean NOT NULL DEFAULT true,  -- concept vs. gepubliceerd
  created_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_reports_date_idx
  ON public.meeting_reports(meeting_date DESC);

-- updated_at automatisch bijwerken (hergebruikt de generieke functie uit 001)
DROP TRIGGER IF EXISTS meeting_reports_updated_at ON public.meeting_reports;
CREATE TRIGGER meeting_reports_updated_at
  BEFORE UPDATE ON public.meeting_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.meeting_reports ENABLE ROW LEVEL SECURITY;

-- Ingelogde leden lezen gepubliceerde verslagen
CREATE POLICY "leden lezen gepubliceerde verslagen" ON public.meeting_reports
  FOR SELECT TO authenticated
  USING (published = true);

-- Admins lezen én beheren alles (ook concepten)
CREATE POLICY "admins beheren verslagen" ON public.meeting_reports
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
