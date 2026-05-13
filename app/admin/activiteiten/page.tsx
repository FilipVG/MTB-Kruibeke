import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Activity } from '@/lib/types/database';

export const metadata = { title: 'Activiteiten beheren — Admin' };

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('nl-BE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminActiviteitenPage() {
  const supabase = await createClient();
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('start_at', { ascending: false });

  const now = new Date().toISOString();
  const komend = (activities ?? []).filter((a: Activity) => a.start_at >= now);
  const voorbij = (activities ?? []).filter((a: Activity) => a.start_at < now);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Activiteiten</h1>
          <p className="text-sm text-ink-400 mt-1">BBQ&apos;s, vergaderingen en andere evenementen.</p>
        </div>
        <Link href="/admin/activiteiten/nieuw" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuwe activiteit
        </Link>
      </div>

      <ActiviteitenLijst title="Komende activiteiten" items={komend.reverse()} />
      {voorbij.length > 0 && (
        <div className="mt-10">
          <ActiviteitenLijst title="Voorbije activiteiten" items={voorbij} dim />
        </div>
      )}

      {!(activities ?? []).length && (
        <div className="card p-12 text-center text-ink-400">Nog geen activiteiten.</div>
      )}
    </div>
  );
}

function ActiviteitenLijst({ title, items, dim = false }: { title: string; items: Activity[]; dim?: boolean }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className={`text-sm font-medium uppercase tracking-wide mb-3 ${dim ? 'text-ink-600' : 'text-ink-400'}`}>
        {title} ({items.length})
      </h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">Titel</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide hidden sm:table-cell">Datum</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide hidden md:table-cell">Locatie</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60">
            {items.map(a => (
              <tr key={a.id} className={dim ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-white">
                  {a.cancelled ? <span className="line-through text-ink-500">{a.title}</span> : a.title}
                  {a.cancelled && <span className="ml-2 text-xs text-red-400">Afgelast</span>}
                </td>
                <td className="px-4 py-3 text-ink-400 hidden sm:table-cell">{formatDate(a.start_at)}</td>
                <td className="px-4 py-3 text-ink-400 hidden md:table-cell">{a.location ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/activiteiten/${a.id}`} className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-white transition">
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
