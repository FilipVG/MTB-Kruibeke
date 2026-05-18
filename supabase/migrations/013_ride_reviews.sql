CREATE TABLE public.ride_reviews (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id    uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score      smallint NOT NULL CHECK (score >= 1 AND score <= 5),
  comment    text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ride_id, user_id)
);

ALTER TABLE public.ride_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leden kunnen reviews lezen"
  ON public.ride_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Leden kunnen eigen review toevoegen"
  ON public.ride_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leden kunnen eigen review bewerken"
  ON public.ride_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leden kunnen eigen review verwijderen"
  ON public.ride_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
