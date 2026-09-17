import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * In- en uitschrijven voor een rit.
 *
 * Bewust via de server in plaats van rechtstreeks vanuit de browser: zo passeert
 * het verzoek de middleware die de sessie ververst. Een klik op een pagina die al
 * uren openstaat (typisch op een smartphone) gebruikte anders het verlopen token
 * uit de cookie. Een DELETE die door RLS geblokkeerd wordt is bovendien géén
 * fout — die verwijdert stilletjes 0 rijen — waardoor een mislukking volledig
 * onzichtbaar bleef. Hier geven we altijd een duidelijke reden terug.
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

  const { data: ride } = await supabase
    .from('rides')
    .select('id, start_at, registration_open, cancelled')
    .eq('id', id)
    .maybeSingle();

  if (!ride) return NextResponse.json({ error: 'Rit niet gevonden.' }, { status: 404 });
  if (ride.cancelled) return NextResponse.json({ error: 'Deze rit is afgelast.' }, { status: 400 });
  if (!ride.registration_open) return NextResponse.json({ error: 'De inschrijvingen zijn gesloten.' }, { status: 400 });
  if (new Date(ride.start_at) <= new Date()) {
    return NextResponse.json({ error: 'Deze rit is al gestart.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('ride_registrations')
    .insert({ ride_id: id, user_id: user.id });

  // 23505 = unique violation: al ingeschreven. Voor de gebruiker is dat geen fout.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Inschrijven mislukt. Probeer opnieuw.' }, { status: 400 });
  }
  return NextResponse.json({ registered: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessie();
  if (!user) return NextResponse.json({ error: SESSIE_VERLOPEN }, { status: 401 });

  // .select() zodat we zien of er écht een rij verwijderd is.
  const { data, error } = await supabase
    .from('ride_registrations')
    .delete()
    .eq('ride_id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Uitschrijven mislukt. Probeer opnieuw.' }, { status: 400 });
  }

  if (!data || data.length === 0) {
    // Niets verwijderd. Ofwel stond je al niet meer ingeschreven, ofwel blokkeert
    // de regel "enkel vóór de start van de rit".
    const { data: ride } = await supabase
      .from('rides')
      .select('start_at')
      .eq('id', id)
      .maybeSingle();

    if (ride && new Date(ride.start_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Deze rit is al gestart, uitschrijven kan niet meer.' },
        { status: 400 },
      );
    }
    // Al uitgeschreven — eindresultaat klopt, dus geen foutmelding.
  }

  return NextResponse.json({ registered: false });
}
