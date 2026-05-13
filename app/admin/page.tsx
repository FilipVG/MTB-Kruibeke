import Link from 'next/link';
import { Calendar, Users, Star, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Admin — MTB Kruibeke' };

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ count: ridesCount }, { count: membersCount }, { count: sponsorsCount }] = await Promise.all([
    supabase.from('rides').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('sponsors').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const sections = [
    {
      href: '/admin/ritten',
      title: 'Ritten beheren',
      desc: 'Maak nieuwe ritten aan, koppel GPX-bestanden en wijs punten toe.',
      icon: Calendar,
      stat: ridesCount,
      statLabel: 'Ritten',
    },
    {
      href: '/admin/leden',
      title: 'Leden beheren',
      desc: 'Rollen toekennen, inschrijvingen aanpassen, leden archiveren.',
      icon: Users,
      stat: membersCount,
      statLabel: 'Actieve leden',
    },
    {
      href: '/admin/sponsors',
      title: 'Sponsors beheren',
      desc: 'Voeg sponsors toe, upload logo&apos;s en bepaal de volgorde.',
      icon: Star,
      stat: sponsorsCount,
      statLabel: 'Sponsors',
    },
    {
      href: '/admin/activiteiten',
      title: 'Activiteiten beheren',
      desc: 'Plan andere activiteiten zoals BBQ&apos;s of vergaderingen.',
      icon: Activity,
      stat: null,
      statLabel: '',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-2">Admin paneel</h1>
      <p className="text-sm text-ink-400 mb-8">Beheer ritten, leden, activiteiten en sponsors.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="card p-6 hover:border-brand-700/50 transition group">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="h-5 w-5 text-brand-500" />
              {s.stat !== null && (
                <div className="text-right">
                  <p className="text-2xl font-semibold text-white">{s.stat ?? 0}</p>
                  <p className="text-[10px] uppercase tracking-wide text-ink-500">{s.statLabel}</p>
                </div>
              )}
            </div>
            <h3 className="font-medium text-white group-hover:text-brand-200 transition">{s.title}</h3>
            <p className="text-sm text-ink-400 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
