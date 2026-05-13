import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInitials, getDisplayName } from '@/lib/utils';
import { Shield, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

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
        </div>
      </div>
    </div>
  );
}
