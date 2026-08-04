import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeReminderAt, DEFAULT_POINTS } from '@/lib/utils';

const VALID_TYPES = ['mtb', 'gravel', 'baanrit', 'wedstrijd'] as const;
type JokerritType = (typeof VALID_TYPES)[number];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
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

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('rides')
    .insert({
      title,
      description: description || null,
      ride_type: type,
      is_jokerrit: true,
      start_at,
      start_location,
      distance_km: distance_km || null,
      in_ranking: true,
      points: DEFAULT_POINTS[type],
      registration_open: true,
      cancelled: false,
      reminder_at: computeReminderAt(start_at, 2),
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ id: data.id });
}
