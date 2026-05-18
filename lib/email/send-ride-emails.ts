import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildRideReminderEmail } from './ride-reminder';

interface Member {
  id: string;
  email: string;
  first_name: string | null;
  nickname: string | null;
}

/**
 * Haalt inschrijvingen + top3 op voor een rit en verstuurt gepersonaliseerde
 * uitnodigings-/herinneringsmails naar alle opgegeven leden in batches van 50.
 * Returnt het aantal verstuurde mails.
 */
export async function sendRideEmails(
  admin: SupabaseClient,
  ride: { id: string; [key: string]: unknown },
  members: Member[],
  resend: Resend,
  siteUrl: string,
  from: string,
): Promise<number> {
  // Inschrijvingen voor deze rit
  const { data: registrations } = await admin
    .from('ride_registrations')
    .select('user_id, profile:profiles(first_name, last_name, nickname)')
    .eq('ride_id', ride.id);

  const registeredIds = new Set((registrations ?? []).map((r: any) => r.user_id));
  const registeredNames = (registrations ?? []).map((r: any) => {
    const p = r.profile as any;
    return p?.nickname || (`${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Onbekend');
  });

  // Top 3 klassement huidig jaar
  const { data: ranking } = await admin.rpc('get_ranking', { p_year: new Date().getFullYear() });
  const top3 = (ranking ?? []).slice(0, 3).map((e: any, i: number) => ({
    place: i + 1,
    name: e.nickname || (`${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Onbekend'),
    total_points: e.total_points,
  }));

  // Bouw gepersonaliseerde mails
  const emails = members.map((m) => {
    const isRegistered = registeredIds.has(m.id);
    const { subject, html } = buildRideReminderEmail(ride as any, top3, siteUrl, isRegistered, registeredNames);
    return { from, to: m.email, subject, html };
  });

  // Verstuur in batches van 50 (Resend limiet)
  let totalSent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    await resend.batch.send(emails.slice(i, i + 50));
    totalSent += Math.min(50, emails.length - i);
  }

  return totalSent;
}
