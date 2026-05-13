import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Leden beheren — Admin' };

export default async function AdminLedenPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, nickname, email, phone, role, is_active')
    .order('first_name', { ascending: true });

  const actief = (members ?? []).filter(m => m.is_active);
  const inactief = (members ?? []).filter(m => !m.is_active);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Leden</h1>
          <p className="text-sm text-ink-400 mt-1">{actief.length} actieve leden.</p>
        </div>
        <Link href="/admin/leden/nieuw" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuw lid
        </Link>
      </div>

      <LedenTabel title="Actieve leden" members={actief} />
      {inactief.length > 0 && (
        <div className="mt-10">
          <LedenTabel title="Inactieve leden" members={inactief} dim />
        </div>
      )}
    </div>
  );
}

function LedenTabel({
  title,
  members,
  dim = false,
}: {
  title: string;
  members: { id: string; first_name: string | null; last_name: string | null; nickname: string | null; email: string | null; phone: string | null; role: string | null; is_active: boolean }[];
  dim?: boolean;
}) {
  return (
    <section>
      <h2 className={`text-sm font-medium uppercase tracking-wide mb-3 ${dim ? 'text-ink-600' : 'text-ink-400'}`}>
        {title} ({members.length})
      </h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">Naam</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide hidden sm:table-cell">E-mail</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide hidden md:table-cell">Telefoon</th>
              <th className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">Rol</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60">
            {members.map(m => {
              const naam = m.nickname || [m.first_name, m.last_name].filter(Boolean).join(' ') || '—';
              return (
                <tr key={m.id} className={dim ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 text-white font-medium">{naam}</td>
                  <td className="px-4 py-3 text-ink-400 hidden sm:table-cell">{m.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-400 hidden md:table-cell">{m.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-brand-900/50 text-brand-300' : 'bg-ink-800 text-ink-400'}`}>
                      {m.role === 'admin' ? 'Admin' : 'Lid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/leden/${m.id}`} className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-white transition">
                      <Pencil className="h-3.5 w-3.5" />
                      Bewerken
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
