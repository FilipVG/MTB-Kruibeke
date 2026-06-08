import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRideEmails } from '@/lib/email/send-ride-emails';
import { buildAttendanceReminderEmail } from '@/lib/email/attendance-reminder';

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
  const nowIso = new Date().toISOString();

  // ── 1. Rituitnodigingen ─────────────────────────────────────────────
  // Ritten waarvan reminder_at is verstreken maar nog geen mail verstuurd.
  // Veiligheid: enkel ritten die nog in de toekomst liggen — nooit een mail
  // voor een rit uit het verleden (bv. bij een verkeerd ingevoerde datum).
  let invitesSent = 0;
  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .lte('reminder_at', nowIso)
    .gt('start_at', nowIso)
    .is('reminder_sent_at', null)
    .eq('cancelled', false);

  if (rides && rides.length > 0) {
    const { data: members } = await supabase
      .from('profiles')
      .select('id, email, first_name, nickname')
      .eq('is_active', true)
      .eq('email_reminders', true);

    if (members && members.length > 0) {
      for (const ride of rides) {
        invitesSent += await sendRideEmails(supabase, ride, members, resend, siteUrl, from);
        await supabase
          .from('rides')
          .update({ reminder_sent_at: new Date().toISOString(), update_pending: false })
          .eq('id', ride.id);
      }
    }
  }

  // ── 2. Aanwezigheids-herinneringen voor admins ──────────────────────
  // Ritten die meer dan een dag geleden gestart zijn, niet afgelast, met
  // minstens één inschrijving waarvan de aanwezigheid nog niet bevestigd is
  // (attended IS NULL). Ritten zonder inschrijvingen vallen weg.
  // Venster: laatste 30 dagen, zodat oude ritten niet eeuwig mailen.
  let attendanceMailsSent = 0;
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: pastRides } = await supabase
    .from('rides')
    .select('id, title, start_at, ride_registrations(attended)')
    .lt('start_at', oneDayAgo)
    .gte('start_at', thirtyDaysAgo)
    .eq('cancelled', false)
    .order('start_at', { ascending: true });

  const pendingRides = (pastRides ?? [])
    .map((r: any) => {
      const regs = r.ride_registrations ?? [];
      const pending = regs.filter((reg: any) => reg.attended === null).length;
      return { id: r.id, title: r.title, start_at: r.start_at, pending_count: pending, total: regs.length };
    })
    .filter((r) => r.total > 0 && r.pending_count > 0);

  if (pendingRides.length > 0) {
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('is_active', true)
      .not('email', 'is', null);

    const adminEmails = (admins ?? []).map((a: any) => a.email as string);
    if (adminEmails.length > 0) {
      const { subject, html } = buildAttendanceReminderEmail(pendingRides, siteUrl);
      const emails = adminEmails.map((to) => ({ from, to, subject, html }));
      for (let i = 0; i < emails.length; i += 50) {
        await resend.batch.send(emails.slice(i, i + 50));
      }
      attendanceMailsSent = adminEmails.length;
    }
  }

  return NextResponse.json({
    invitesSent,
    rides: rides?.length ?? 0,
    attendanceMailsSent,
    ridesPendingConfirmation: pendingRides.length,
  });
}
