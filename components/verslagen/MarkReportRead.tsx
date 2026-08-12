'use client';

import { useEffect } from 'react';

/**
 * Registreert bij het echt openen van een verslag (mount) één keer dat de
 * ingelogde gebruiker het geopend heeft. Vuurt niet bij Next-prefetch, enkel
 * bij een werkelijke navigatie.
 */
export function MarkReportRead({ reportId }: { reportId: string }) {
  useEffect(() => {
    fetch(`/api/verslagen/${reportId}/open`, { method: 'POST' }).catch(() => {});
  }, [reportId]);
  return null;
}
