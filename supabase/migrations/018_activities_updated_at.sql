-- Voeg updated_at toe aan activities (ontbrak in initieel schema)
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Zet updated_at gelijk aan created_at voor bestaande rijen
UPDATE public.activities SET updated_at = created_at WHERE updated_at = now();

-- Trigger om updated_at automatisch bij te houden
CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
