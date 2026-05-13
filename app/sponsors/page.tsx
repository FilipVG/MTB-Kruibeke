import { ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Sponsor } from '@/lib/types/database';

export const metadata = { title: 'Sponsors — MTB Kruibeke' };

export default async function SponsorsPage() {
  const supabase = await createClient();
  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('*')
    .eq('is_active', true)
    .order('tier', { ascending: true })
    .order('display_order', { ascending: true });

  const mainSponsors = (sponsors ?? []).filter((s: Sponsor) => s.tier === 'main');
  const regularSponsors = (sponsors ?? []).filter((s: Sponsor) => s.tier === 'regular');

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2">Onze sponsors</h1>
      <p className="text-sm text-ink-400 mb-10 max-w-2xl">
        Dankzij onze sponsors kunnen we de club draaiende houden en de kledij betaalbaar maken.
      </p>

      {/* Hoofdsponsors */}
      {mainSponsors.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-brand-400 font-medium mb-4">
            Hoofdsponsors
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {mainSponsors.map(sponsor => (
              <SponsorTile key={sponsor.id} sponsor={sponsor} variant="main" />
            ))}
          </div>
        </div>
      )}

      {/* Reguliere sponsors */}
      {regularSponsors.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 font-medium mb-4">
            Sponsors
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regularSponsors.map(sponsor => (
              <SponsorTile key={sponsor.id} sponsor={sponsor} variant="regular" />
            ))}
          </div>
        </div>
      )}

      {!sponsors?.length && (
        <div className="card p-12 text-center text-ink-400">Nog geen sponsors toegevoegd.</div>
      )}
    </div>
  );
}

function SponsorTile({ sponsor, variant }: { sponsor: Sponsor; variant: 'main' | 'regular' }) {
  const isMain = variant === 'main';

  const wrapperClass = isMain
    ? 'relative card p-8 hover:border-brand-600 transition flex items-center gap-6 border-brand-700/40'
    : 'card p-6 hover:border-brand-700/40 transition flex items-center gap-4';

  const logoBox = sponsor.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sponsor.logo_url}
      alt={sponsor.name}
      className={isMain ? 'h-28 w-28 object-contain shrink-0 bg-white rounded-md p-3' : 'h-20 w-20 object-contain shrink-0 bg-white/95 rounded-md p-2'}
    />
  ) : (
    <div
      className={
        isMain
          ? 'h-28 w-28 bg-brand-900/40 rounded-md flex items-center justify-center text-brand-300 text-3xl font-semibold shrink-0'
          : 'h-20 w-20 bg-ink-800 rounded-md flex items-center justify-center text-ink-300 text-2xl font-medium shrink-0'
      }
    >
      {sponsor.name.charAt(0)}
    </div>
  );

  const body = (
    <>
      {isMain && (
        <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
      )}
      {logoBox}
      <div className="flex-1 min-w-0">
        <h3 className={isMain ? 'text-xl font-medium text-white flex items-center gap-1.5' : 'text-base font-medium text-white flex items-center gap-1.5'}>
          {sponsor.name}
          {sponsor.website_url && <ExternalLink className="h-3 w-3 text-ink-500" />}
        </h3>
        {sponsor.description && (
          <p className={isMain ? 'text-base text-ink-400 mt-1 line-clamp-2' : 'text-sm text-ink-500 mt-0.5 line-clamp-1'}>
            {sponsor.description}
          </p>
        )}
      </div>
    </>
  );

  if (sponsor.website_url) {
    return (
      <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
        {body}
      </a>
    );
  }
  return <div className={wrapperClass}>{body}</div>;
}
