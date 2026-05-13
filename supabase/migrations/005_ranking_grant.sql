-- Geef de authenticated rol leesrecht op de ranking view
-- zodat die via de PostgREST API bereikbaar is.
GRANT SELECT ON public.ranking TO authenticated;
