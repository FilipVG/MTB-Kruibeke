import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? supabase : null;
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const { email, first_name, last_name, phone, birthdate, role } = await req.json();
  const normalizedEmail = email.toLowerCase().trim();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from('profiles').update({
    first_name: first_name || null,
    last_name: last_name || null,
    phone: phone || null,
    birthdate: birthdate || null,
    role: role || 'member',
  }).eq('id', data.user.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtbkruibeke.be';
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-wachtwoord` },
  });

  return NextResponse.json({ id: data.user.id, link: linkData?.properties?.action_link ?? null });
}
