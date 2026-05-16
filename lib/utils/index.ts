import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, isPast, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRideDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return `Vandaag · ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Morgen · ${format(d, 'HH:mm')}`;
  return format(d, "EEEE d MMMM · HH:mm", { locale: nl });
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEE d MMM', { locale: nl });
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
