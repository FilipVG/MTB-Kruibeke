-- ============================================================
-- Migration: sponsor tiers (hoofdsponsor vs gewone sponsor)
-- ============================================================

create type sponsor_tier as enum ('main', 'regular');

alter table public.sponsors
  add column tier sponsor_tier not null default 'regular';

-- Index voor sortering op tier + volgorde
create index sponsors_tier_order_idx on public.sponsors(tier, display_order);
