-- Correct group-stage kickoff times (stored in UTC; CEST = UTC+2)
-- België - Egypte:        ma 15 juni 21:00 CEST = 19:00 UTC
-- België - Iran:          zo 21 juni 21:00 CEST = 19:00 UTC
-- Nieuw-Zeeland - België: za 27 juni 05:00 CEST = 03:00 UTC (27 juni, niet 26)

UPDATE wk2026_matches SET start_at = '2026-06-15 19:00:00+00' WHERE opponent = 'Egypte'        AND phase = 'groep';
UPDATE wk2026_matches SET start_at = '2026-06-21 19:00:00+00' WHERE opponent = 'Iran'          AND phase = 'groep';
UPDATE wk2026_matches SET start_at = '2026-06-27 03:00:00+00' WHERE opponent = 'Nieuw-Zeeland' AND phase = 'groep';
