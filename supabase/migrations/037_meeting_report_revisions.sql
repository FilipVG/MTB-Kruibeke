-- Wijzigingsgeschiedenis (track changes) voor vergaderverslagen.
-- Bij elke inhoudelijke wijziging bewaart een trigger een volledige momentopname
-- + wie (auth.uid()) + wanneer (now()).

ALTER TABLE public.meeting_reports
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.meeting_report_revisions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      uuid NOT NULL REFERENCES public.meeting_reports(id) ON DELETE CASCADE,
  edited_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  edited_at      timestamptz NOT NULL DEFAULT now(),
  -- momentopname van de toestand na deze wijziging
  title          text NOT NULL,
  meeting_date   date NOT NULL,
  attendees      text,
  content        text NOT NULL DEFAULT '',
  published      boolean NOT NULL DEFAULT true,
  attachment_url text
);

CREATE INDEX IF NOT EXISTS meeting_report_revisions_report_idx
  ON public.meeting_report_revisions(report_id, edited_at);

-- Triggerfunctie: logt een revisie bij inhoudelijke wijzigingen en zet updated_by.
-- SECURITY DEFINER zodat de insert in revisions de RLS omzeilt, ongeacht de aanroeper.
CREATE OR REPLACE FUNCTION public.log_meeting_report_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enkel loggen bij een echte inhoudelijke wijziging. Zo negeren we bv. de
  -- notified_at-update door de cron (die geen gevolgd veld raakt).
  IF TG_OP = 'UPDATE' AND
     NEW.title = OLD.title AND
     NEW.meeting_date = OLD.meeting_date AND
     COALESCE(NEW.attendees, '') = COALESCE(OLD.attendees, '') AND
     NEW.content = OLD.content AND
     NEW.published = OLD.published AND
     COALESCE(NEW.attachment_url, '') = COALESCE(OLD.attachment_url, '')
  THEN
    RETURN NEW;
  END IF;

  NEW.updated_by := auth.uid();

  INSERT INTO public.meeting_report_revisions
    (report_id, edited_by, title, meeting_date, attendees, content, published, attachment_url)
  VALUES
    (NEW.id, auth.uid(), NEW.title, NEW.meeting_date, NEW.attendees, NEW.content, NEW.published, NEW.attachment_url);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS meeting_report_log_revision ON public.meeting_reports;
CREATE TRIGGER meeting_report_log_revision
  BEFORE INSERT OR UPDATE ON public.meeting_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_meeting_report_revision();

ALTER TABLE public.meeting_report_revisions ENABLE ROW LEVEL SECURITY;

-- Enkel admins mogen de geschiedenis lezen
CREATE POLICY "admins lezen verslag-revisies" ON public.meeting_report_revisions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Backfill: begin-revisie per bestaand verslag + updated_by als basislijn.
UPDATE public.meeting_reports SET updated_by = created_by WHERE updated_by IS NULL;

INSERT INTO public.meeting_report_revisions
  (report_id, edited_by, edited_at, title, meeting_date, attendees, content, published, attachment_url)
SELECT id, created_by, COALESCE(updated_at, created_at), title, meeting_date, attendees, content, published, attachment_url
FROM public.meeting_reports mr
WHERE NOT EXISTS (
  SELECT 1 FROM public.meeting_report_revisions rev WHERE rev.report_id = mr.id
);
