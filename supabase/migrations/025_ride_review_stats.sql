-- Aggregaat-view met de gemiddelde score + aantal reviews per rit.
-- Bevat enkel cijfers (geen review-inhoud), dus publiek leesbaar — zo kan de
-- gemiddelde score ook getoond worden op de publieke kalender en in de ICS-feed.
-- (De view draait als owner en omzeilt zo de RLS op ride_reviews; enkel de
--  geaggregeerde getallen worden blootgesteld.)

CREATE OR REPLACE VIEW public.ride_review_stats AS
SELECT
  ride_id,
  round(avg(score)::numeric, 1) AS avg_score,
  count(*)::int                 AS review_count
FROM public.ride_reviews
GROUP BY ride_id;

GRANT SELECT ON public.ride_review_stats TO anon, authenticated;
