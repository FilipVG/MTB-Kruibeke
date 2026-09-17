import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * In- en uitschrijven voor een activiteit. Zelfde opzet als bij de ritten:
 * via de server, zodat de sessie vers is en een mislukking een duidelijke
 * reden krijgt in plaats van stil te falen.
 */

const SESSIE_VERLOPEN = 'Je sessie is verlopen. Log opnieuw in en probeer nog eens.';

async function getSessie() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessie();
  if (!user) return NextResponse.json({ error: SESSIE_VERLOPEN }, { status: 401 });

  const { data: activity } = await supabase
    .from('activities')
    .select('id, cancelled')
    .eq('id', id)
    .maybeSingle();

  if (!activity) return NextResponse.json({ error: 'Activiteit niet gevonden.' }, { status: 404 });
  if (activity.cancelled) return NextResponse.json({ error: 'Deze activiteit is afgelast.' }, { status: 400 });

  const { error } = await supabase
    .from('activity_registrations')
    .insert({ activity_id: id, user_id: user.id });

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Inschrijven mislukt. Probeer opnieuw.' }, { status: 400 });
  }
  return NextResponse.json({ registered: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessie();
  if (!user) return NextResponse.json({ error: SESSIE_VERLOPEN }, { status: 401 });

  const { error } = await supabase
    .from('activity_registrations')
    .delete()
    .eq('activity_id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Uitschrijven mislukt. Probeer opnieuw.' }, { status: 400 });
  }
  return NextResponse.json({ registered: false });
}
