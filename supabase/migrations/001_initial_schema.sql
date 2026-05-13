-- ============================================================
-- MTB Kruibeke — Initial schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (uitbreiding op auth.users)
-- ============================================================
create type user_role as enum ('member', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text,
  last_name text,
  nickname text,
  bio text,
  avatar_url text,
  phone text,
  birthdate date,
  role user_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- Profiel automatisch aanmaken bij signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. RIDES (ritten)
-- ============================================================
create type ride_type as enum ('mtb', 'gravel');

create table public.rides (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  ride_type ride_type not null,
  start_at timestamptz not null,
  start_location text not null,
  start_lat double precision,
  start_lng double precision,
  distance_km numeric(5,1),
  gpx_url text,
  -- Puntenklassement
  in_ranking boolean not null default false,
  points int not null default 0 check (points >= 0 and points <= 5),
  -- Inschrijvingen open / gesloten
  registration_open boolean not null default true,
  max_participants int,
  cancelled boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rides_start_at_idx on public.rides(start_at);
create index rides_in_ranking_idx on public.rides(in_ranking);

-- ============================================================
-- 3. RIDE REGISTRATIONS
-- ============================================================
create table public.ride_registrations (
  id uuid primary key default uuid_generate_v4(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean, -- na de rit door admin gezet voor puntenklassement
  notes text,
  created_at timestamptz not null default now(),
  unique(ride_id, user_id)
);

create index ride_reg_user_idx on public.ride_registrations(user_id);
create index ride_reg_ride_idx on public.ride_registrations(ride_id);

-- ============================================================
-- 4. ACTIVITIES (niet-ritten: BBQ, vergadering, etc.)
-- ============================================================
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  registration_required boolean not null default false,
  max_participants int,
  cancelled boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index activities_start_at_idx on public.activities(start_at);

create table public.activity_registrations (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(activity_id, user_id)
);

-- ============================================================
-- 5. SPONSORS
-- ============================================================
create table public.sponsors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  website_url text,
  logo_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. VIEW: actueel puntenklassement
-- ============================================================
create or replace view public.ranking as
select
  p.id,
  p.nickname,
  p.first_name,
  p.last_name,
  p.avatar_url,
  coalesce(sum(r.points), 0)::int as total_points,
  count(rr.id)::int as rides_attended
from public.profiles p
left join public.ride_registrations rr
  on rr.user_id = p.id and rr.attended = true
left join public.rides r
  on r.id = rr.ride_id and r.in_ranking = true
where p.is_active = true
group by p.id
order by total_points desc, rides_attended desc;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_registrations enable row level security;
alter table public.activities enable row level security;
alter table public.activity_registrations enable row level security;
alter table public.sponsors enable row level security;

-- Helper: ben ik admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- PROFILES ----------
-- Iedereen die ingelogd is mag alle (actieve) profielen lezen (wie-is-wie)
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

-- Eigen profiel updaten
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
-- Let op: het ROLE-veld kan een gebruiker zelf niet wijzigen.

-- Admin kan alles op profiles
create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- RIDES ----------
-- Publiek leesbaar (kalender is openbaar)
create policy "rides_select_public"
on public.rides for select
to anon, authenticated
using (true);

-- Alleen admin schrijft
create policy "rides_admin_write"
on public.rides for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- RIDE REGISTRATIONS ----------
-- Iedereen ingelogd ziet wie ingeschreven is
create policy "ride_reg_select"
on public.ride_registrations for select
to authenticated
using (true);

-- Lid mag zichzelf in/uitschrijven tot start van de rit
create policy "ride_reg_insert_own"
on public.ride_registrations for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.rides r
    where r.id = ride_id
      and r.start_at > now()
      and r.registration_open = true
      and r.cancelled = false
  )
);

create policy "ride_reg_delete_own"
on public.ride_registrations for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.rides r
    where r.id = ride_id
      and r.start_at > now()
  )
);

-- Admin mag alles
create policy "ride_reg_admin_all"
on public.ride_registrations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- ACTIVITIES ----------
create policy "activities_select_public"
on public.activities for select
to anon, authenticated
using (true);

create policy "activities_admin_write"
on public.activities for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- ACTIVITY REGISTRATIONS ----------
create policy "activity_reg_select"
on public.activity_registrations for select
to authenticated
using (true);

create policy "activity_reg_insert_own"
on public.activity_registrations for insert
to authenticated
with check (auth.uid() = user_id);

create policy "activity_reg_delete_own"
on public.activity_registrations for delete
to authenticated
using (auth.uid() = user_id);

create policy "activity_reg_admin_all"
on public.activity_registrations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- SPONSORS ----------
create policy "sponsors_select_public"
on public.sponsors for select
to anon, authenticated
using (is_active = true or public.is_admin());

create policy "sponsors_admin_write"
on public.sponsors for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger rides_updated_at before update on public.rides
  for each row execute function public.set_updated_at();
