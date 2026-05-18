import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRideEmails } from '@/lib/email/send-ride-emails';

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

  let totalSent = 0;

  for (const ride of rides) {
    totalSent += await sendRideEmails(supabase, ride, members, resend, siteUrl, from);

    await supabase
      .from('rides')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', ride.id);
  }

  return NextResponse.json({ sent: totalSent, rides: rides.length });
}
