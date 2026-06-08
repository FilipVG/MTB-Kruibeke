'use client';

/**
 * Toont onder een datum/tijd-veld de gekozen datum voluit in het Nederlands,
 * bv. "→ zaterdag 1 augustus 2026 om 09:00". Zo ziet wie een rit aanmaakt
 * meteen of 01/08 als 1 augustus of (fout) als 8 januari geïnterpreteerd werd —
 * ongeacht de taalinstelling van de browser.
 *
 * Parseert de waarde tijdzone-onafhankelijk uit de losse onderdelen, zodat de
 * getoonde tekst exact overeenkomt met wat in het veld staat.
 */
export function DateTimeEcho({ value, dateOnly = false }: { value: string; dateOnly?: boolean }) {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;

  const [, y, mo, d, h, mi] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d, h ? +h : 0, mi ? +mi : 0));

  const opts: Intl.DateTimeFormatOptions = dateOnly
    ? { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };

  const txt = new Intl.DateTimeFormat('nl-BE', opts).format(dt);

  return (
    <p className="mt-1.5 text-xs font-medium text-brand-300">
      → {txt}{dateOnly ? '' : ' u'}
    </p>
  );
}
