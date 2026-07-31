import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildReviewReminderEmail } from '@/lib/email/review-reminder';

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

  const now = Date.now();
  // Ritten die minstens 8u geleden gestart zijn, maar niet ouder dan 48u.
  // De ondergrens vermijdt dat oude ritten alsnog gemaild worden (bv. bij een
  // eerste deploy) en is ruim genoeg zodat elke rit door de dagelijkse cron
  // exact één keer opgepikt wordt. review_reminder_sent_at voorkomt duplicaten.
  const eightHoursAgo = new Date(now - 8 * 3600 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now - 48 * 3600 * 1000).toISOString();

  const { data: rides } = await supabase
    .from('rides')
    .select('id, title, start_at, ride_type')
    .lte('start_at', eightHoursAgo)
    .gte('start_at', fortyEightHoursAgo)
    .eq('cancelled', false)
    .is('review_reminder_sent_at', null);

  let reviewMailsSent = 0;
  let ridesProcessed = 0;

  for (const ride of rides ?? []) {
    // Deelnemers = ingeschreven leden, die review-herinneringen aan hebben.
    const { data: registrations } = await supabase
      .from('ride_registrations')
      .select('profile:profiles(email, is_active, review_reminders)')
      .eq('ride_id', ride.id);

    // PostgREST geeft de to-one relatie 'profile' als object terug (de
    // supabase-js types leiden het als array af — vandaar de any-cast, zoals
    // elders in de mailflow).
    const recipients = (registrations ?? [])
      .map((r: any) => r.profile as { email: string | null; is_active: boolean; review_reminders: boolean } | null)
      .filter((p): p is { email: string; is_active: boolean; review_reminders: boolean } =>
        !!p && p.is_active && p.review_reminders && !!p.email);

    if (recipients.length > 0) {
      const { subject, html } = buildReviewReminderEmail(ride, siteUrl);
      const emails = recipients.map((p) => ({ from, to: p.email, subject, html }));
      for (let i = 0; i < emails.length; i += 50) {
        await resend.batch.send(emails.slice(i, i + 50));
      }
      reviewMailsSent += recipients.length;
    }

    // Altijd markeren als verwerkt — ook zonder ontvangers — zodat deze rit
    // niet elke run opnieuw opgehaald wordt.
    await supabase
      .from('rides')
      .update({ review_reminder_sent_at: new Date().toISOString() })
      .eq('id', ride.id);
    ridesProcessed++;
  }

  return NextResponse.json({ ridesProcessed, reviewMailsSent });
}
