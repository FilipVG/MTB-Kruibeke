-- Ranking view: enkel huidig jaar, jokerrit telt alleen mee bij 4+ bevestigde deelnemers
CREATE OR REPLACE VIEW public.ranking AS
WITH jokerrit_qualified AS (
  SELECT ride_id
  FROM public.ride_registrations
  WHERE attended = true
  GROUP BY ride_id
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
  AND (r.ride_type != 'jokerrit' OR r.id IN (SELECT ride_id FROM jokerrit_qualified))
WHERE p.is_active = true
GROUP BY p.id
ORDER BY total_points DESC, rides_attended DESC;

GRANT SELECT ON public.ranking TO authenticated;

-- Historisch klassement per jaar met jokerrit drempel
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
      AND r2.ride_type = 'jokerrit'
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
    AND (r.ride_type != 'jokerrit' OR r.id IN (SELECT ride_id FROM jokerrit_qualified))
  WHERE p.is_active = true
  GROUP BY p.id
  ORDER BY total_points DESC, rides_attended DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO authenticated;
