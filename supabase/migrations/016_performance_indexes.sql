-- ============================================================
-- Performance indexes
-- ============================================================

-- Actieve profielen: veel queries filteren op is_active = true
CREATE INDEX IF NOT EXISTS profiles_is_active_idx
  ON public.profiles(id)
  WHERE is_active = true;

-- Aanwezige deelnemers: klassement en profielpagina filteren op attended = true
CREATE INDEX IF NOT EXISTS ride_reg_attended_idx
  ON public.ride_registrations(ride_id)
  WHERE attended = true;

-- Gebruiker + aanwezigheid: profielpagina haalt ritten per user op met attended-filter
CREATE INDEX IF NOT EXISTS ride_reg_user_attended_idx
  ON public.ride_registrations(user_id, attended);

-- Jokerrit-organisator: lookup op created_by voor bewerkrechten
CREATE INDEX IF NOT EXISTS rides_created_by_idx
  ON public.rides(created_by);

-- Niet-geannuleerde ritten: kalender en homepage filteren bijna altijd op cancelled = false
CREATE INDEX IF NOT EXISTS rides_active_start_at_idx
  ON public.rides(start_at)
  WHERE cancelled = false;
