-- Vlag die aangeeft dat een rit gewijzigd is nadat de uitnodigingsmail al
-- verstuurd was. Zet de knop "Stuur update naar deelnemers" aan in de admin.
ALTER TABLE public.rides
  ADD COLUMN update_pending boolean NOT NULL DEFAULT false;
