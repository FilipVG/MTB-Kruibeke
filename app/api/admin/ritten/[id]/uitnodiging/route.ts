import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRideEmails } from '@/lib/email/send-ride-emails';

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

  const { data: members } = await admin
    .from('profiles')
    .select('id, email, first_name, nickname')
    .eq('is_active', true)
    .eq('email_reminders', true)
    .not('email', 'is', null);

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Geen leden met uitnodigingen ingeschakeld.' });
  }

  const totalSent = await sendRideEmails(admin, ride, members, resend, siteUrl, from);
  return NextResponse.json({ sent: totalSent });
}
