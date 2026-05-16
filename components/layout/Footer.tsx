import Link from 'next/link';
import { Logo } from './Logo';
import { AbonneerKnop } from '@/components/kalender/AbonneerKnop';

export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-ink-400 max-w-xs">
              Mountainbike club sinds 2012.
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
            <p className="text-sm text-ink-400 mb-4">
              Abonneer op de kalender in Google Calendar, Apple Agenda of Outlook.
            </p>
            <AbonneerKnop url={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mtb-kruibeke.vercel.app'}/api/calendar.ics`} />
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
