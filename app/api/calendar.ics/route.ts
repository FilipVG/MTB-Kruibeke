import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Endpoint: /api/calendar.ics
 * Levert alle ritten + activiteiten als iCalendar feed.
 * Te abonneren in Google Calendar, Apple Agenda, Outlook…
 */
export async function GET() {
  const supabase = await createClient();

  // Komende + recente ritten (laatste maand + komende 6 maanden)
  const lowerBound = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .gte('start_at', lowerBound)
    .eq('cancelled', false);

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .gte('start_at', lowerBound)
    .eq('cancelled', false);

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtbkruibeke.be';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MTB Kruibeke//Kalender//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MTB Kruibeke',
    'X-WR-TIMEZONE:Europe/Brussels',
    'X-WR-CALDESC:Kalender van MTB Kruibeke',
  ];

  // Ritten
  for (const ride of rides ?? []) {
    const start = new Date(ride.start_at);
    // Standaard duur 2.5u voor MTB
    const end = new Date(start.getTime() + 2.5 * 3600 * 1000);
    const emoji = ride.ride_type === 'mtb' ? '🚵' : ride.ride_type === 'gravel' ? '🚴' : '🏁';
    const summary = `${emoji} ${ride.title}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:ride-${ride.id}@mtbkruibeke.be`,
      `DTSTAMP:${formatICalDate(new Date(ride.created_at))}`,
      `DTSTART:${formatICalDate(start)}`,
      `DTEND:${formatICalDate(end)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(ride.description ?? '')}`,
      `LOCATION:${escapeText(ride.start_location)}`,
      `URL:${site}/kalender#rit-${ride.id}`,
      'END:VEVENT'
    );
  }

  // Activiteiten
  for (const act of activities ?? []) {
    const start = new Date(act.start_at);
    const end = act.end_at ? new Date(act.end_at) : new Date(start.getTime() + 2 * 3600 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:activity-${act.id}@mtbkruibeke.be`,
      `DTSTAMP:${formatICalDate(new Date(act.created_at))}`,
      `DTSTART:${formatICalDate(start)}`,
      `DTEND:${formatICalDate(end)}`,
      `SUMMARY:${escapeText(act.title)}`,
      `DESCRIPTION:${escapeText(act.description ?? '')}`,
      act.location ? `LOCATION:${escapeText(act.location)}` : '',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  // Vouw lange regels (RFC 5545 vereist max 75 chars)
  const body = lines.filter(Boolean).join('\r\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      'Content-Disposition': 'inline; filename="mtb-kruibeke.ics"',
    },
  });
}
