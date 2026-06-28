-- WK 2026 telt met 48 landen ook een ronde van 32 (1/16 finale) vóór de 1/8.
-- Voeg die fase toe aan de enum, net na de groepsfase.
ALTER TYPE wk2026_phase ADD VALUE IF NOT EXISTS 'zestiende' AFTER 'groep';
