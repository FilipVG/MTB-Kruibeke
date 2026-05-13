import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-ink-400 max-w-xs">
              Mountainbike club met passie voor de sport. Toertochten in het Waasland sinds 2003.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Ontdek</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link href="/kalender" className="hover:text-white">Kalender</Link></li>
              <li><Link href="/sponsors" className="hover:text-white">Sponsors</Link></li>
              <li><Link href="/lid-worden" className="hover:text-white">Lid worden</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Kalender importeren</h4>
            <p className="text-sm text-ink-400 mb-2">
              Abonneer op de kalender in Google Calendar, Apple Agenda of Outlook.
            </p>
            <Link
              href="/api/calendar.ics"
              className="text-sm text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
            >
              iCal feed →
            </Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-ink-800 text-xs text-ink-500 flex justify-between">
          <span>© {new Date().getFullYear()} MTB Kruibeke</span>
          <span>Gebouwd met Next.js & Supabase</span>
        </div>
      </div>
    </footer>
  );
}
