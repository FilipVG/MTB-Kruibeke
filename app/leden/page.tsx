import { createClient } from '@/lib/supabase/server';
import { getInitials, getDisplayName, cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export const metadata = { title: 'Wie is wie — MTB Kruibeke' };

export default async function LedenPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2">Wie is wie</h1>
      <p className="text-sm text-ink-400 mb-8">
        Onze leden ({members?.length ?? 0}).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(members ?? []).map(member => (
          <div key={member.id} className="card p-5">
            <div className="flex items-start gap-4">
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className={cn(
                  'h-14 w-14 rounded-full flex items-center justify-center font-medium text-white shrink-0',
                  'bg-brand-700'
                )}>
                  {getInitials(member)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-white truncate">{getDisplayName(member)}</p>
                  {member.role === 'admin' && (
                    <Shield className="h-3.5 w-3.5 text-brand-400" aria-label="Administrator" />
                  )}
                </div>
                {member.nickname && (member.first_name || member.last_name) && (
                  <p className="text-xs text-ink-500 truncate">
                    {member.first_name} {member.last_name}
                  </p>
                )}
                {member.bio && (
                  <p className="text-sm text-ink-300 mt-2 line-clamp-3">{member.bio}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
