import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Registreert dat de ingelogde gebruiker dit verslag geopend heeft
// (eerste keer + teller + laatste keer, via register_report_open).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true }); // no-op zonder sessie

  await supabase.rpc('register_report_open', { p_report_id: id });
  return NextResponse.json({ ok: true });
}
