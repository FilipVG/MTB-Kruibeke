-- Ranking view: enkel huidig jaar
CREATE OR REPLACE VIEW public.ranking AS
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
  AND EXTRACT(YEAR FROM r.start_at AT TIME ZONE 'Europe/Brussels')
      = EXTRACT(YEAR FROM now()    AT TIME ZONE 'Europe/Brussels')
WHERE p.is_active = true
GROUP BY p.id
ORDER BY total_points DESC, rides_attended DESC;

GRANT SELECT ON public.ranking TO authenticated;

-- Functie voor historisch klassement per jaar
CREATE OR REPLACE FUNCTION public.get_ranking(p_year int)
RETURNS TABLE (
  id            uuid,
  nickname      text,
  first_name    text,
  last_name     text,
  avatar_url    text,
  total_points  int,
  rides_attended int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
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
    AND EXTRACT(YEAR FROM r.start_at AT TIME ZONE 'Europe/Brussels') = p_year
  WHERE p.is_active = true
  GROUP BY p.id
  ORDER BY total_points DESC, rides_attended DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO authenticated;

-- Jaren waarvoor er effectief klassementspunten zijn
CREATE OR REPLACE FUNCTION public.get_ranking_years()
RETURNS TABLE (jaar int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT EXTRACT(YEAR FROM r.start_at AT TIME ZONE 'Europe/Brussels')::int AS jaar
  FROM public.ride_registrations rr
  JOIN public.rides r ON r.id = rr.ride_id AND r.in_ranking = true
  WHERE rr.attended = true
  ORDER BY jaar DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking_years() TO authenticated;
