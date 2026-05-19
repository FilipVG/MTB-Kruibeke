import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getNewsletterData } from '@/lib/newsletter';
import { buildNewsletterEmail } from '@/lib/email/newsletter';

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const supabase = authResult;

  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json().catch(() => ({}));
  const test_mode: boolean = body.test_mode !== false;
  const intro_text: string = body.intro_text ?? '';

  const data = await getNewsletterData(supabase);

  if (data.changedCount === 0) {
    return NextResponse.json(
      { error: 'Geen nieuwe of gewijzigde items. Nieuwsbrief niet verstuurd.' },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtbkruibeke.be';
  const { subject, html } = buildNewsletterEmail(data.rides, data.activities, siteUrl, intro_text);

  const admin = createAdminClient();

  let query = admin.from('profiles').select('email').eq('is_active', true);
  if (test_mode) {
    query = (query as any).eq('role', 'admin');
  } else {
    query = (query as any).eq('wants_newsletter', true);
  }
  const { data: recipients } = await query;
  const emails = (recipients ?? []).map((r: any) => r.email).filter(Boolean) as string[];

  if (emails.length === 0) {
    return NextResponse.json({ error: 'Geen ontvangers gevonden.' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = 'MTB Kruibeke <no-reply@mtbkruibeke.be>';

  let totalSent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50).map(to => ({ from, to, subject, html }));
    await resend.batch.send(batch);
    totalSent += batch.length;
  }

  // Enkel loggen bij echte verzending — testmodus verschuift de referentiedatum niet
  if (!test_mode) {
    await admin.from('newsletter_runs').insert({
      sent_by: user?.id ?? null,
      recipient_count: totalSent,
      test_mode: false,
      new_item_count: data.changedCount,
    });
    // Introtekst wissen na verzending naar leden
    await admin.from('newsletter_settings').upsert({ id: 1, intro_text: '', updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ sent: totalSent, test_mode, items: data.changedCount });
}
