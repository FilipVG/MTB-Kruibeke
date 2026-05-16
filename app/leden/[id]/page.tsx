import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInitials, getDisplayName, cn } from '@/lib/utils';
import { Shield, Phone, Mail, Clock, Check } from 'lucide-react';
import Link from 'next/link';

function formatLastSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nog nooit aangelogd';
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export default async function LidProfielPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!member) notFound();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1).toISOString();

  const { data: regData } = await supabase
    .from('ride_registrations')
    .select(`id, attended, ride:rides(id, title, start_at, points, in_ranking, cancelled)`)
    .eq('user_id', id);

  const ritten = (regData ?? [])
    .filter((r: any) => {
      if (!r.ride || r.ride.cancelled) return false;
      const isGepland = r.ride.start_at >= now.toISOString();
      const isDitJaar = r.ride.start_at >= startOfYear && r.ride.start_at < endOfYear;
      return isGepland || (isDitJaar && r.attended === true);
    })
    .sort((a: any, b: any) => new Date(a.ride.start_at).getTime() - new Date(b.ride.start_at).getTime());

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <Link href="/leden" className="text-sm text-ink-400 hover:text-white mb-8 inline-flex items-center gap-1">
        ← Alle leden
      </Link>

      <div className="card p-8 mt-4">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-6">
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatar_url} alt="" className="h-28 w-28 rounded-full object-cover mb-4" />
          ) : (
            <div className="h-28 w-28 rounded-full bg-brand-700 flex items-center justify-center text-3xl font-medium text-white mb-4">
              {getInitials(member)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-white">{getDisplayName(member)}</h1>
            {member.role === 'admin' && (
              <Shield className="h-4 w-4 text-brand-400" aria-label="Administrator" />
            )}
          </div>
          {member.nickname && (member.first_name || member.last_name) && (
            <p className="text-sm text-ink-400 mt-1">{member.first_name} {member.last_name}</p>
          )}
        </div>

        {/* Bio */}
        {member.bio && (
          <div className="border-t border-ink-800 pt-6 mb-6">
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide text-center mb-2">Over mezelf</p>
            <p className="text-sm text-ink-300 leading-relaxed text-center">{member.bio}</p>
          </div>
        )}

        {/* Contactinfo */}
        <div className="border-t border-ink-800 pt-6 space-y-3">
          {member.email && (
            <div className="flex items-center gap-3 text-sm text-ink-300">
              <Mail className="h-4 w-4 text-ink-500 shrink-0" />
              <a href={`mailto:${member.email}`} className="hover:text-white truncate">{member.email}</a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-3 text-sm text-ink-300">
              <Phone className="h-4 w-4 text-ink-500 shrink-0" />
              <a href={`tel:${member.phone}`} className="hover:text-white">{member.phone}</a>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-ink-400">
            <Clock className="h-4 w-4 text-ink-500 shrink-0" />
            <span>Laatste bezoek: {formatLastSeen(member.last_seen_at)}</span>
          </div>
        </div>
      </div>
      {ritten.length > 0 && (
        <div className="card mt-6 px-4 py-2">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide px-1 pt-3 pb-2">
            Ritten {now.getFullYear()}
          </p>
          <div className="divide-y divide-ink-800">
            {ritten.map((r: any) => {
              const start = new Date(r.ride.start_at);
              const isVoorbij = start < now;
              const datumLabel = start.toLocaleDateString('nl-BE', {
                timeZone: 'Europe/Brussels',
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              return (
                <div key={r.id} className={cn('flex items-center gap-3 py-2 px-1', isVoorbij && 'opacity-60')}>
                  <span className="w-20 shrink-0 text-xs text-ink-400 capitalize">{datumLabel}</span>
                  <Link href={`/kalender/${r.ride.id}`} className="flex-1 min-w-0 text-sm font-medium text-white hover:text-brand-300 truncate">
                    {r.ride.title}
                  </Link>
                  {r.ride.in_ranking && r.ride.points > 0 && (
                    <span className="shrink-0 text-xs text-amber-400">{r.ride.points} pt</span>
                  )}
                  {isVoorbij
                    ? r.attended && <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                    : <span className="shrink-0 text-xs text-ink-500">ingeschreven</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
