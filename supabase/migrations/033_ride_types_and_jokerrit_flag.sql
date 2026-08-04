-- Rittypes herwerken + jokerrit als eigenschap i.p.v. type.
--
-- 1) Nieuw type 'wedstrijd'.
-- 2) Nieuwe kolom is_jokerrit (jokerrit wordt een vlag met onderliggend type).
-- 3) Bestaande jokerritten omzetten naar (ride_type='mtb', is_jokerrit=true).
--    Punten en in_ranking blijven ONGEMOEID — geen retroactieve herprijzing.
-- 4) get_ranking() + ranking-view: de ≥4-drempel keyt voortaan op is_jokerrit.
--
-- Opmerking: 'wedstrijd' wordt in dit script niet gebruikt (enkel toegevoegd),
-- dus de ADD VALUE is veilig binnen dezelfde transactie. De enumwaarde 'jokerrit'
-- blijft bestaan (Postgres kan ze niet droppen) maar wordt niet meer gebruikt.

ALTER TYPE ride_type ADD VALUE IF NOT EXISTS 'wedstrijd';

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS is_jokerrit boolean NOT NULL DEFAULT false;

-- Bestaande jokerritten: vlag zetten, type naar mtb; punten/in_ranking ongewijzigd.
UPDATE public.rides
  SET is_jokerrit = true, ride_type = 'mtb'
  WHERE ride_type = 'jokerrit';

-- Klassement (huidig jaar) — jokerrit-drempel op is_jokerrit
CREATE OR REPLACE VIEW public.ranking AS
WITH jokerrit_qualified AS (
  SELECT rr2.ride_id
  FROM public.ride_registrations rr2
  JOIN public.rides r2 ON r2.id = rr2.ride_id
  WHERE rr2.attended = true
    AND r2.is_jokerrit = true
  GROUP BY rr2.ride_id
  HAVING COUNT(*) >= 4
)
SELECT
  p.id,
  p.nickname,
  p.first_name,
  p.last_name,
  p.avatar_url,
  COALESCE(SUM(r.points), 0)::int AS total_points,
  COUNT(rr.id)::int                AS rides_attended
FROM public.profiles p
LEFT JOIN public.ride_registrations rr
  ON rr.user_id = p.id AND rr.attended = true
LEFT JOIN public.rides r
  ON r.id = rr.ride_id
  AND r.in_ranking = true
  AND r.cancelled = false
  AND EXTRACT(YEAR FROM r.start_at AT TIME ZONE 'Europe/Brussels')
      = EXTRACT(YEAR FROM now()    AT TIME ZONE 'Europe/Brussels')
  AND (r.is_jokerrit = false OR r.id IN (SELECT ride_id FROM jokerrit_qualified))
WHERE p.is_active = true
GROUP BY p.id
ORDER BY total_points DESC, rides_attended DESC;

GRANT SELECT ON public.ranking TO authenticated;

-- Historisch klassement per jaar — jokerrit-drempel op is_jokerrit
CREATE OR REPLACE FUNCTION public.get_ranking(p_year int)
RETURNS TABLE (
  id             uuid,
  nickname       text,
  first_name     text,
  last_name      text,
  avatar_url     text,
  total_points   int,
  rides_attended int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH jokerrit_qualified AS (
    SELECT rr2.ride_id
    FROM public.ride_registrations rr2
    JOIN public.rides r2 ON r2.id = rr2.ride_id
    WHERE rr2.attended = true
      AND r2.is_jokerrit = true
      AND EXTRACT(YEAR FROM r2.start_at AT TIME ZONE 'Europe/Brussels') = p_year
    GROUP BY rr2.ride_id
    HAVING COUNT(*) >= 4
  )
  SELECT
    p.id,
    p.nickname,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(SUM(r.points), 0)::int AS total_points,
    COUNT(rr.id)::int                AS rides_attended
  FROM public.profiles p
  LEFT JOIN public.ride_registrations rr
    ON rr.user_id = p.id AND rr.attended = true
  LEFT JOIN public.rides r
    ON r.id = rr.ride_id
    AND r.in_ranking = true
    AND r.cancelled = false
    AND EXTRACT(YEAR FROM r.start_at AT TIME ZONE 'Europe/Brussels') = p_year
    AND (r.is_jokerrit = false OR r.id IN (SELECT ride_id FROM jokerrit_qualified))
  WHERE p.is_active = true
  GROUP BY p.id
  ORDER BY total_points DESC, rides_attended DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO authenticated;
