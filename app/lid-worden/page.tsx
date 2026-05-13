import Link from 'next/link';
import { Check, Calendar, Users, Trophy, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Lid worden — MTB Kruibeke' };

const voordelen = [
  { icon: Calendar, title: 'Wekelijkse ritten', text: 'Toertocht op zondag, training op dinsdagavond.' },
  { icon: Users, title: 'Tof gezelschap', text: 'Geen competitie, wel vriendschap en ervaring.' },
  { icon: Trophy, title: 'Puntenklassement', text: 'Speel mee voor het seizoenklassement.' },
  { icon: ShieldCheck, title: 'Verzekerd', text: 'Aangesloten via een erkende federatie.' },
];

const verwachtingen = [
  'Respect voor mede-rijders, andere weggebruikers en de natuur',
  'Helm dragen tijdens elke rit',
  'Aankomen op tijd op de afgesproken startlocatie',
  'Fiets in orde houden (banden, remmen, ketting)',
  'Onverhoeds wegrijden van de groep vermijden',
];

export default function LidWordenPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">Lid worden</h1>
      <p className="text-base text-ink-300 mb-10 max-w-2xl leading-relaxed">
        MTB Kruibeke verenigt een groep mensen met een passie voor mountainbiken.
        Iedereen is vrij om een paar keer met ons mee te (test)rijden voor je beslist.
      </p>

      <h2 className="text-xl font-semibold text-white mb-4">Wat bieden we?</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {voordelen.map(item => (
          <div key={item.title} className="card p-5">
            <item.icon className="h-5 w-5 text-brand-500 mb-3" />
            <h3 className="font-medium text-white mb-1">{item.title}</h3>
            <p className="text-sm text-ink-400">{item.text}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Wat verwachten we?</h2>
      <div className="card p-6 mb-12">
        <ul className="space-y-2.5">
          {verwachtingen.map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-ink-200">
              <Check className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Klaar om aan te sluiten?</h2>
      <div className="card p-6">
        <p className="text-sm text-ink-300 mb-4">
          Stuur ons een e-mail met wat info over jezelf en je fietservaring.
          Of kom gewoon eens een keer mee rijden — kijk op de kalender wanneer de volgende rit is.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:info@mtbkruibeke.be" className="btn-primary">
            Stuur een e-mail
          </a>
          <Link href="/kalender" className="btn-secondary">
            Bekijk kalender
          </Link>
        </div>
      </div>
    </div>
  );
}
