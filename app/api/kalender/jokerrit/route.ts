import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeReminderAt } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { title, description, start_at, start_location, distance_km } = await req.json();

  // Startdatum moet minstens 7 dagen in de toekomst liggen
  const startDate = new Date(start_at);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  minDate.setHours(0, 0, 0, 0);

  if (startDate < minDate) {
    return NextResponse.json(
      { error: 'Startdatum moet minstens een week in de toekomst liggen.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('rides')
    .insert({
      title,
      description: description || null,
      ride_type: 'jokerrit',
      start_at,
      start_location,
      distance_km: distance_km ? Number(distance_km) : null,
      in_ranking: true,
      points: 2,
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
