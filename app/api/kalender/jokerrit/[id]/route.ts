import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeReminderAt, DEFAULT_POINTS } from '@/lib/utils';

const VALID_TYPES = ['mtb', 'gravel', 'baanrit', 'wedstrijd'] as const;
type JokerritType = (typeof VALID_TYPES)[number];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  // Controleer of de ingelogde gebruiker de organisator is
  const { data: ride } = await supabase
    .from('rides')
    .select('id, created_by, is_jokerrit')
    .eq('id', id)
    .single();

  if (!ride || !ride.is_jokerrit) {
    return NextResponse.json({ error: 'Rit niet gevonden' }, { status: 404 });
  }

  if (ride.created_by !== user.id) {
    return NextResponse.json({ error: 'Enkel de organisator kan deze rit wijzigen' }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, start_at, start_location, distance_km } = body;
  const type: JokerritType = VALID_TYPES.includes(body.ride_type) ? body.ride_type : 'mtb';

  // Startdatum moet minstens 5 dagen in de toekomst liggen (enkel datum, geen uur)
  const startDateOnly = new Date(start_at).toISOString().slice(0, 10);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 5);
  const minDateOnly = minDate.toISOString().slice(0, 10);

  if (startDateOnly < minDateOnly) {
    return NextResponse.json(
      { error: 'Startdatum moet minstens 5 dagen in de toekomst liggen.' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('rides')
    .update({
      title,
      description: description || null,
      ride_type: type,
      points: DEFAULT_POINTS[type],
      start_at,
      start_location,
      distance_km: distance_km || null,
      reminder_at: computeReminderAt(start_at, 2),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
