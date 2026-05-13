-- Automatisch gegenereerd op 2026-05-13
-- 24 events uit Google Calendar (2026)
-- Veilig: slaat rijen over als titel + datum al bestaat

-- RITTEN (23)
insert into public.rides (title, description, ride_type, start_at, start_location, registration_open)
select v.title, v.description, v.ride_type::ride_type, v.start_at::timestamptz, v.start_location, v.registration_open
from (values
  ('*** Middelkerke (eigen rit) ***', NULL, 'mtb', '2026-02-15 09:00:00+01', 'Nog te bepalen', true),
  ('Malle', 'Op zondag 4 januari 2026 organiseren de White Cliffs of Malle een MTB en graveltoertocht.', 'mtb', '2026-01-04 09:00:00+01', 'Herentalsebaan 56, 2390 Malle, België', true),
  ('Baanritje', NULL, 'mtb', '2026-02-08 09:00:00+01', 'Nog te bepalen', true),
  ('Toertocht Sinaai', NULL, 'mtb', '2026-05-24 09:00:00+01', 'Nog te bepalen', true),
  ('Toertocht Overijse', 'Voetbalcomplex Hagaard, Bredestraat 57, 3090 Overijse', 'mtb', '2026-05-03 09:00:00+01', 'Bredestraat 57, 3090 Overijse', true),
  ('Toertocht Stekene', NULL, 'mtb', '2026-05-10 09:00:00+01', 'Nog te bepalen', true),
  ('Toertocht Rillaar', 'Zaal Kortakker, Kortakker z/n, 3202 Rillaar', 'mtb', '2026-04-19 09:00:00+01', 'Kortakker z/n, 3202 Rillaar', true),
  ('Toertocht Nieuwkerken-Waas', NULL, 'mtb', '2026-03-29 09:00:00+01', 'Gyselstraat 35, 9100 Sint-Niklaas', true),
  ('*** Malmedy ***', NULL, 'mtb', '2026-05-31 09:00:00+01', 'Nog te bepalen', true),
  ('Toertocht Puurs', NULL, 'mtb', '2026-04-19 09:00:00+01', 'Buisstraat 19D, 2890 Puurs-Sint-Amands', true),
  ('Toertocht Sinaai', 'KFC Herleving Sinaai', 'mtb', '2026-04-05 09:00:00+01', 'Vleeshouwersstraat 4/A, 9112 Sint-Niklaas', true),
  ('*** Chouffe ***', NULL, 'mtb', '2026-08-16 09:00:00+01', 'Nog te bepalen', true),
  ('Toertocht Opwijk', NULL, 'mtb', '2026-04-26 09:00:00+01', 'Steenweg op Vilvoorde 227, 1745 Opwijk', true),
  ('Boucles de Lasne', NULL, 'mtb', '2026-05-25 09:00:00+01', 'Rte d''Ohain 9A, 1380 Lasne', true),
  ('Keiheuvel Balen', NULL, 'mtb', '2026-02-07 09:00:00+01', 'Nog te bepalen', true),
  ('*** MTB Weekend ***', NULL, 'mtb', '2026-09-18 09:00:00+01', 'Nog te bepalen', true),
  ('Hammerstone', NULL, 'mtb', '2026-10-16 09:00:00+01', 'Nog te bepalen', true),
  ('*** Limburg Zwarte Lus ***', NULL, 'mtb', '2026-04-04 09:00:00+01', 'Nog te bepalen', true),
  ('Kalmthout (eigen rit)', NULL, 'mtb', '2026-01-11 09:00:00+01', 'Nog te bepalen', true),
  ('Kalmthout (Eigen rit)', NULL, 'mtb', '2026-02-01 09:00:00+01', 'Nog te bepalen', true),
  ('Belsele', NULL, 'mtb', '2026-01-25 09:00:00+01', 'Sint-Andriesstraat 10, 9111 Sint-Niklaas', true),
  ('Kater baanritje', NULL, 'mtb', '2026-01-18 09:00:00+01', 'Nog te bepalen', true),
  ('Transforestiere Tellin', NULL, 'mtb', '2026-05-01 09:00:00+01', 'Nog te bepalen', true)
) as v(title, description, ride_type, start_at, start_location, registration_open)
where not exists (
  select 1 from public.rides r
  where r.title = v.title
  and r.start_at::date = v.start_at::timestamptz::date
);

-- ACTIVITEITEN (1)
insert into public.activities (title, description, start_at, location)
select 'Nieuwejaarsfeestje', NULL, '2026-01-17 16:30:00+00'::timestamptz, NULL
where not exists (
  select 1 from public.activities
  where title = 'Nieuwejaarsfeestje'
  and start_at::date = '2026-01-17'
);
