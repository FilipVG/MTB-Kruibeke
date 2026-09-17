'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Ververst de servergegevens wanneer de bezoeker na een tijd terugkeert naar de
 * pagina. Op een smartphone blijft een tabblad vaak uren op de achtergrond
 * staan; bij terugkeer toonde de pagina dan verouderde informatie (bv. nog
 * "Ingeschreven" terwijl dat al gewijzigd was) en was ook de sessie intussen
 * verlopen. Door hier te verversen loopt de middleware opnieuw — die vernieuwt
 * meteen de sessie — en klopt wat je ziet weer.
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        return;
      }
      // Enkel verversen na een noemenswaardige afwezigheid, zodat kort wisselen
      // tussen apps geen onnodige verzoeken veroorzaakt.
      if (hiddenAt.current !== null && Date.now() - hiddenAt.current > 30_000) {
        router.refresh();
      }
      hiddenAt.current = null;
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [router]);

  return null;
}
