import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { intro_text } = await request.json();
  const admin = createAdminClient();
  await admin.from('newsletter_settings').upsert({ id: 1, intro_text: intro_text ?? '', updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
