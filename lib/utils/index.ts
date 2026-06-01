import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = 'Europe/Brussels';

function brusselsDayStr(d: Date): string {
  return new Intl.DateTimeFormat('sv', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

export function formatRideDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const dayStr = brusselsDayStr(d);
  const todayStr = brusselsDayStr(now);
  const tomorrowStr = brusselsDayStr(new Date(now.getTime() + 86_400_000));

  const time = new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit',
  }).format(d);

  if (dayStr === todayStr) return `Vandaag · ${time}`;
  if (dayStr === tomorrowStr) return `Morgen · ${time}`;

  const label = new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long',
  }).format(d);
  return `${label} · ${time}`;
}

export function formatMatchDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const label = new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long',
  }).format(d);
  const time = new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit',
  }).format(d);
  return `${label} • ${time}u`;
}

export function formatShortDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const label = new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, day: 'numeric', month: 'short',
  }).format(d);
  const time = new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit',
  }).format(d);
  return `${label} ${time}u`;
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short',
  }).format(d);
}

export function getInitials(profile: {
  nickname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  if (profile.nickname) return profile.nickname.substring(0, 2).toUpperCase();
  const first = profile.first_name?.[0] ?? '';
  const last = profile.last_name?.[0] ?? '';
  return (first + last).toUpperCase() || '??';
}

export function getDisplayName(profile: {
  nickname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  if (profile.nickname) return profile.nickname;
  return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Onbekend';
}

export function isRegistrationOpen(ride: { start_at: string; registration_open: boolean; cancelled: boolean }): boolean {
  return ride.registration_open && !ride.cancelled && !isPast(new Date(ride.start_at));
}

export function rideTypeBadge(type: string): string {
  if (type === 'mtb') return 'badge-mtb';
  if (type === 'gravel') return 'badge-gravel';
  if (type === 'jokerrit') return 'badge-jokerrit';
  return 'badge-baanrit';
}

export function rideTypeLabel(type: string): string {
  if (type === 'mtb') return 'MTB';
  if (type === 'gravel') return 'Gravel';
  if (type === 'jokerrit') return 'Jokerrit';
  return 'Training';
}

export function rideTypeEmoji(type: string): string {
  if (type === 'mtb') return '🚵';
  if (type === 'gravel') return '🚴';
  if (type === 'jokerrit') return '🤡';
  return '🏁';
}

export function computeReminderAt(startAtUtc: string, daysBefore: number): string {
  const d = new Date(startAtUtc);
  d.setUTCDate(d.getUTCDate() - daysBefore);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_GPX_BYTES = 5 * 1024 * 1024;
const MAX_VWB_PDF_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Enkel JPG, PNG of WebP toegestaan.';
  if (file.size > MAX_AVATAR_BYTES) return 'Bestand mag maximaal 2 MB zijn.';
  return null;
}

export function validateVwbFile(file: File): string | null {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_VWB_PDF_BYTES) return 'PDF mag maximaal 10 MB zijn.';
    return null;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Enkel JPG, PNG, WebP of PDF toegestaan.';
  if (file.size > MAX_AVATAR_BYTES) return 'Afbeelding mag maximaal 2 MB zijn.';
  return null;
}

export function validateGpxFile(file: File): string | null {
  if (file.name.split('.').pop()?.toLowerCase() !== 'gpx') return 'Enkel GPX-bestanden zijn toegestaan.';
  if (file.size > MAX_GPX_BYTES) return 'Bestand mag maximaal 5 MB zijn.';
  return null;
}

// Geeft een standaard startdatum terug als "YYYY-MM-DDTHH:mm" in Brussels-tijd, standaard 09:00
export function defaultStartAt(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const datePart = new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Brussels',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  return `${datePart}T09:00`;
}

// Converteert UTC ISO-string naar "YYYY-MM-DDTHH:mm" in Brussels-tijd (voor datetime-local input)
export function toDatetimeLocal(utcStr: string): string {
  return new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Brussels',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(utcStr)).replace(' ', 'T');
}

// Converteert "YYYY-MM-DDTHH:mm" (Brussels-tijd) terug naar UTC ISO-string
export function fromDatetimeLocal(localStr: string): string {
  const approx = new Date(localStr + 'Z');
  const offsetStr = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Brussels',
    timeZoneName: 'shortOffset',
  }).formatToParts(approx).find(p => p.type === 'timeZoneName')?.value ?? 'GMT+2';
  const match = offsetStr.match(/GMT([+-]\d+)/);
  const offsetHours = match ? parseInt(match[1]) : 2;
  const sign = offsetHours >= 0 ? '+' : '-';
  const pad = String(Math.abs(offsetHours)).padStart(2, '0');
  return new Date(`${localStr}:00${sign}${pad}:00`).toISOString();
}
