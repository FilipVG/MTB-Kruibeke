-- Editienummer van de Off-Road Update per echte verzending bijhouden, voor
-- weergave en historiek. Het volgende nummer wordt afgeleid uit het aantal
-- echte runs in het lopende jaar (zie lib/newsletter.ts getNextIssueNumber);
-- deze kolommen bewaren het toegekende nummer op de run zelf.
-- Nullable: historische runs (van vóór deze feature) blijven leeg.

ALTER TABLE public.newsletter_runs
  ADD COLUMN IF NOT EXISTS issue_year   int,
  ADD COLUMN IF NOT EXISTS issue_number int;
