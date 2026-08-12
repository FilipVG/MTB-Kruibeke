-- Leesbevestigingen voor vergaderverslagen: wie heeft geopend, hoe vaak,
-- eerste en laatste keer. Eén rij per (verslag, lid).

CREATE TABLE IF NOT EXISTS public.meeting_report_reads (
  report_id       uuid NOT NULL REFERENCES public.meeting_reports(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  first_opened_at timestamptz NOT NULL DEFAULT now(),
  last_opened_at  timestamptz NOT NULL DEFAULT now(),
  open_count      int NOT NULL DEFAULT 1,
  PRIMARY KEY (report_id, user_id)
);

ALTER TABLE public.meeting_report_reads ENABLE ROW LEVEL SECURITY;

-- Lid ziet zijn eigen leesrij; admins zien alles. Registratie loopt via de
-- functie hieronder (SECURITY DEFINER), dus een INSERT/UPDATE-policy is niet nodig.
CREATE POLICY "opening zichtbaar" ON public.meeting_report_reads
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert-of-increment in één atomische stap. first_opened_at blijft staan (enkel bij
-- de INSERT); bij een volgende opening +1 op open_count en last_opened_at bijwerken.
CREATE OR REPLACE FUNCTION public.register_report_open(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.meeting_report_reads (report_id, user_id)
  VALUES (p_report_id, auth.uid())
  ON CONFLICT (report_id, user_id) DO UPDATE
    SET open_count = meeting_report_reads.open_count + 1,
        last_opened_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_report_open(uuid) TO authenticated;
