-- Verwijder de volledige WK 2026-pronosticmodule: tabellen, functies en enum.
-- De pagina's, admin-module en frontend-referenties zijn uit de codebase gehaald;
-- deze migratie ruimt de bijhorende databaseobjecten op.
--
-- DROP ... CASCADE ruimt meteen de RLS-policies en triggers op die aan deze
-- objecten hangen. De volgorde respecteert de foreign keys (predictions -> matches).

DROP TABLE IF EXISTS wk2026_predictions CASCADE;
DROP TABLE IF EXISTS wk2026_matches     CASCADE;
DROP TABLE IF EXISTS wk2026_settings    CASCADE;

DROP FUNCTION IF EXISTS wk2026_enforce_single_joker() CASCADE;
DROP FUNCTION IF EXISTS update_wk2026_updated_at()     CASCADE;

DROP TYPE IF EXISTS wk2026_phase;
