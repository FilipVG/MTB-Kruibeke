import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRideReminderEmail } from '@/lib/email/ride-reminder';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Vercel injecteert automatisch Authorization: Bearer CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtbkruibeke.be';
  const from = process.env.RESEND_FROM ?? 'MTB Kruibeke <noreply@mtbkruibeke.be>';

  // Ritten waarvan reminder_at is verstreken maar nog geen mail verstuurd
  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .lte('reminder_at', new Date().toISOString())
    .is('reminder_sent_at', null)
    .eq('cancelled', false);

  if (!rides || rides.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Geen ritten te verwerken.' });
  }

  // Leden met email_reminders aan
  const { data: members } = await supabase
    .from('profiles')
    .select('id, email, first_name, nickname')
    .eq('is_active', true)
    .eq('email_reminders', true);

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Geen leden met herinneringen ingeschakeld.' });
  }

  // Top 3 klassement huidig jaar
  const huidigJaar = new Date().getFullYear();
  const { data: ranking } = await supabase
    .rpc('get_ranking', { p_year: huidigJaar });

  const top3 = (ranking ?? []).slice(0, 3).map((e: any, i: number) => ({
    place: i + 1,
    name: e.nickname ?? (`${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Onbekend'),
    total_points: e.total_points,
  }));

  let totalSent = 0;

  for (const ride of rides) {
    const { subject, html } = buildRideReminderEmail(ride, top3, siteUrl);

    // Stuur naar alle leden (batch van max 50 per call)
    const emails = members.map((m: any) => ({
      from,
      to: m.email,
      subject,
      html,
    }));

    // Verwerk in batches van 50 (Resend limiet)
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      await resend.batch.send(batch);
      totalSent += batch.length;
    }

    // Markeer als verstuurd
    await supabase
      .from('rides')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', ride.id);
  }

  return NextResponse.json({ sent: totalSent, rides: rides.length });
}
