import https from 'https';
import fs from 'fs';

const ICAL_URL = 'https://calendar.google.com/calendar/ical/432qqivi4seohb0egq5vjrieb8%40group.calendar.google.com/private-4ac6b2d28d26648f51f9ec1628e616fe/basic.ics';
const YEAR = '2026';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseIcal(raw) {
  // Unfold lines (iCal wraps long lines with \r\n + space)
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n');

  const events = [];
  const blocks = unfolded.split('BEGIN:VEVENT');
  for (const block of blocks.slice(1)) {
    const end = block.indexOf('END:VEVENT');
    const lines = block.slice(0, end).trim().split('\n');
    const props = {};
    for (const line of lines) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const key = line.slice(0, colon).split(';')[0].trim().toUpperCase();
      const value = line.slice(colon + 1).trim();
      props[key] = value;
    }
    events.push(props);
  }
  return events;
}

function toTimestamp(dtstart, isAllDay) {
  // dtstart format: 20260525 (date) or 20260525T090000Z (datetime)
  const y = dtstart.slice(0, 4);
  const m = dtstart.slice(4, 6);
  const d = dtstart.slice(6, 8);
  if (isAllDay) {
    return `${y}-${m}-${d} 09:00:00+01`;
  }
  return `${y}-${m}-${d} ${dtstart.slice(9, 11)}:${dtstart.slice(11, 13)}:${dtstart.slice(13, 15)}+00`;
}

function escape(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function classifyEvent(summary) {
  const s = summary.toLowerCase();
  if (s.includes('vergadering') || s.includes('bestuur') || s.includes('meeting')) return 'activity';
  if (s.includes('bbq') || s.includes('feest') || s.includes('eetfestijn')) return 'activity';
  return 'ride';
}

async function main() {
  console.log('iCal ophalen...');
  const raw = await fetch(ICAL_URL);
  const events = parseIcal(raw);

  const yearEvents = events.filter(e => e.DTSTART && e.DTSTART.startsWith(YEAR));
  console.log(`${yearEvents.length} events gevonden voor ${YEAR}`);

  const rides = [];
  const activities = [];

  for (const e of yearEvents) {
    const isAllDay = !e.DTSTART.includes('T');
    const ts = toTimestamp(e.DTSTART, isAllDay);
    const type = classifyEvent(e.SUMMARY || '');
    const title = e.SUMMARY || 'Onbekend';
    const location = e.LOCATION || '';
    const description = e.DESCRIPTION || '';

    if (type === 'ride') {
      rides.push({ title, location, description, ts });
    } else {
      activities.push({ title, location, description, ts });
    }
  }

  let sql = `-- Automatisch gegenereerd op ${new Date().toISOString().slice(0, 10)}\n`;
  sql += `-- ${yearEvents.length} events uit Google Calendar (${YEAR})\n\n`;

  if (rides.length > 0) {
    sql += `-- RITTEN (${rides.length})\n`;
    sql += `insert into public.rides (title, description, ride_type, start_at, start_location, registration_open)\nvalues\n`;
    sql += rides.map((r, i) => {
      const desc = r.description || r.location ? escape(r.description || r.location) : 'NULL';
      const loc = r.location ? escape(r.location) : escape('Nog te bepalen');
      return `  (${escape(r.title)}, ${desc}, 'mtb', '${r.ts}', ${loc}, true)`;
    }).join(',\n');
    sql += ';\n\n';
  }

  if (activities.length > 0) {
    sql += `-- ACTIVITEITEN (${activities.length})\n`;
    sql += `insert into public.activities (title, description, start_at, location)\nvalues\n`;
    sql += activities.map(a => {
      const desc = a.description ? escape(a.description) : 'NULL';
      const loc = a.location ? escape(a.location) : 'NULL';
      return `  (${escape(a.title)}, ${desc}, '${a.ts}', ${loc})`;
    }).join(',\n');
    sql += ';\n';
  }

  const outFile = 'supabase/migrations/003_import_2026_rides.sql';
  fs.writeFileSync(outFile, sql);
  console.log(`\nSQL geschreven naar ${outFile}`);
  console.log(`  Ritten: ${rides.length}`);
  console.log(`  Activiteiten: ${activities.length}`);
  console.log('\nEvents:');
  yearEvents.forEach(e => console.log(`  ${e.DTSTART.slice(0, 8)}  ${e.SUMMARY}`));
}

main().catch(console.error);
