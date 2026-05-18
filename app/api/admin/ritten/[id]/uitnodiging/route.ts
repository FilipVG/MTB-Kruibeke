import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRideReminderEmail } from '@/lib/email/ride-reminder';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtbkruibeke.be';
  const from = process.env.RESEND_FROM ?? 'MTB Kruibeke <noreply@mtbkruibeke.be>';
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Rit ophalen
  const { data: ride } = await admin.from('rides').select('*').eq('id', id).single();
  if (!ride) return NextResponse.json({ error: 'Rit niet gevonden' }, { status: 404 });

  // Inschrijvingen ophalen
  const { data: registrations } = await admin
    .from('ride_registrations')
    .select('user_id, profile:profiles(first_name, last_name, nickname)')
    .eq('ride_id', id);

  const registeredIds = new Set((registrations ?? []).map((r: any) => r.user_id));
  const registeredNames = (registrations ?? []).map((r: any) => {
    const p = r.profile as any;
    return p?.nickname || (`${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Onbekend');
  });

  // Top 3 klassement
  const { data: ranking } = await admin.rpc('get_ranking', { p_year: new Date().getFullYear() });
  const top3 = (ranking ?? []).slice(0, 3).map((e: any, i: number) => ({
    place: i + 1,
    name: e.nickname || (`${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Onbekend'),
    total_points: e.total_points,
  }));

  // Alle actieve leden die uitnodigingen willen ontvangen
  const { data: members } = await admin
    .from('profiles')
    .select('id, email, first_name, nickname')
    .eq('is_active', true)
    .eq('email_reminders', true)
    .not('email', 'is', null);

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Geen leden met uitnodigingen ingeschakeld.' });
  }

  const emails = members.map((m: any) => {
    const isRegistered = registeredIds.has(m.id);
    const { subject, html } = buildRideReminderEmail(ride, top3, siteUrl, isRegistered, registeredNames);
    return { from, to: m.email, subject, html };
  });

  let totalSent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    await resend.batch.send(emails.slice(i, i + 50));
    totalSent += Math.min(50, emails.length - i);
  }

  return NextResponse.json({ sent: totalSent });
}
