import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: member } = await supabase.from('profiles').select('email').eq('id', id).single();
  if (!member?.email) return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 });

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtb-kruibeke.vercel.app';

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: member.email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-wachtwoord`,
    },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ link: data.properties.action_link });
}
