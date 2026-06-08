import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRideUpdateEmail } from '@/lib/email/ride-update';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtbkruibeke.be';
  const from = process.env.RESEND_FROM ?? 'MTB Kruibeke <noreply@mtbkruibeke.be>';
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: ride } = await admin.from('rides').select('*').eq('id', id).single();
  if (!ride) return NextResponse.json({ error: 'Rit niet gevonden' }, { status: 404 });

  // Enkel de leden die ingeschreven zijn voor deze rit.
  const { data: registrations } = await admin
    .from('ride_registrations')
    .select('profile:profiles(email, is_active)')
    .eq('ride_id', id);

  const recipients = (registrations ?? [])
    .map((r: any) => r.profile)
    .filter((p: any) => p && p.is_active && p.email)
    .map((p: any) => p.email as string);

  if (recipients.length === 0) {
    // Geen ontvangers, maar markeer wel als afgehandeld.
    await admin.from('rides').update({ update_pending: false }).eq('id', id);
    return NextResponse.json({ sent: 0, message: 'Geen ingeschreven leden om te mailen.' });
  }

  const { subject, html } = buildRideUpdateEmail(ride, siteUrl);

  const emails = recipients.map((to) => ({ from, to, subject, html }));
  for (let i = 0; i < emails.length; i += 50) {
    await resend.batch.send(emails.slice(i, i + 50));
  }

  await admin.from('rides').update({ update_pending: false }).eq('id', id);

  return NextResponse.json({ sent: recipients.length });
}
