import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Sponsor } from '@/lib/types/database';

export const metadata = { title: 'Sponsors beheren — Admin' };

export default async function AdminSponsorsPage() {
  const supabase = await createClient();
  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('*')
    .order('tier', { ascending: true })
    .order('display_order', { ascending: true });

  const actief = (sponsors ?? []).filter((s: Sponsor) => s.is_active);
  const inactief = (sponsors ?? []).filter((s: Sponsor) => !s.is_active);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Sponsors</h1>
          <p className="text-sm text-ink-400 mt-1">{actief.length} actieve sponsors.</p>
        </div>
        <Link href="/admin/sponsors/nieuw" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuwe sponsor
        </Link>
      </div>

      <SponsorTabel title="Actieve sponsors" sponsors={actief} />
      {inactief.length > 0 && (
        <div className="mt-10">
          <SponsorTabel title="Inactieve sponsors" sponsors={inactief} dim />
        </div>
      )}
    </div>
  );
}

function SponsorTabel({ title, sponsors, dim = false }: { title: string; sponsors: Sponsor[]; dim?: boolean }) {
  return (
    <section>
      <h2 className={`text-sm font-medium uppercase tracking-wide mb-3 ${dim ? 'text-ink-600' : 'text-ink-400'}`}>
        {title} ({sponsors.length})
      </h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">Naam</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide hidden md:table-cell">Volgorde</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60">
            {sponsors.map(s => (
              <tr key={s.id} className={dim ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt="" className="h-8 w-8 object-contain bg-white rounded p-0.5" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-ink-800 flex items-center justify-center text-xs font-medium text-ink-300">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium text-white">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.tier === 'main' ? 'bg-brand-900/50 text-brand-300' : 'bg-ink-800 text-ink-400'}`}>
                    {s.tier === 'main' ? 'Hoofdsponsor' : 'Sponsor'}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-400 hidden md:table-cell">{s.display_order}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/sponsors/${s.id}`} className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-white transition">
                    <Pencil className="h-3.5 w-3.5" />
                    Bewerken
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
