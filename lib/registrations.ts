/**
 * Client-side helper voor in- en uitschrijven. Praat met de server-routes zodat
 * de sessie altijd vers is, en vertaalt het antwoord naar iets waar de knop
 * meteen op kan reageren (melding tonen of naar de login sturen).
 */

export type RegistrationResult =
  | { ok: true; registered: boolean }
  | { ok: false; error: string; needsLogin: boolean };

async function call(url: string, register: boolean): Promise<RegistrationResult> {
  try {
    const res = await fetch(url, { method: register ? 'POST' : 'DELETE' });
    const data = await res.json().catch(() => ({} as { error?: string; registered?: boolean }));

    if (res.ok) return { ok: true, registered: !!data.registered };

    return {
      ok: false,
      error: data.error ?? 'Er ging iets mis. Probeer opnieuw.',
      needsLogin: res.status === 401,
    };
  } catch {
    return { ok: false, error: 'Geen verbinding. Probeer opnieuw.', needsLogin: false };
  }
}

export function setRideRegistration(rideId: string, register: boolean) {
  return call(`/api/ritten/${rideId}/inschrijving`, register);
}

export function setActivityRegistration(activityId: string, register: boolean) {
  return call(`/api/activiteiten/${activityId}/inschrijving`, register);
}
