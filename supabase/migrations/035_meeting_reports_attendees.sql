-- Aanwezigen bij de vergadering (vrij tekstveld) toevoegen aan de verslagen.
ALTER TABLE public.meeting_reports
  ADD COLUMN IF NOT EXISTS attendees text;
