import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { RideCardCompact } from '@/components/rides/RideCardCompact';
import type { Ride, Profile, Sponsor } from '@/lib/types/database';

export default async function HomePage() {
  const supabase = await createClient();
  const current = await getCurrentUser();

  type Registration = { id: string; user_id: string; profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'> };

  const { data: upcomingRides } = await supabase
    .from('rides')
    .select(`*, registrations:ride_registrations(id, user_id, profile:profiles(id, nickname, first_name, last_name, avatar_url))`)
    .gte('start_at', new Date().toISOString())
    .eq('cancelled', false)
    .order('start_at', { ascending: true })
    .limit(3);

  const ridesWithMeta = (upcomingRides ?? []).map((r: Ride & { registrations: Registration[] }) => ({
    ...r,
    registration_count: r.registrations?.length ?? 0,
    is_registered: current?.user ? r.registrations?.some(reg => reg.user_id === current.user.id) : false,
  }));

  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('*')
    .eq('is_active', true)
    .order('tier', { ascending: true }) // 'main' komt alfabetisch vóór 'regular'
    .order('display_order', { ascending: true });

  const mainSponsors = (sponsors ?? []).filter((s: Sponsor) => s.tier === 'main');
  const regularSponsors = (sponsors ?? []).filter((s: Sponsor) => s.tier === 'regular');

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white/70 mb-4">
            Mountainbike club · Waasland
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white max-w-3xl leading-[1.1]">
            Samen rijden,<br />samen genieten.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
            Elke zondag een toertocht, dinsdag training. MTB en gravel in het
            Waasland en daarbuiten. Geen competitie, wel vriendschap en vooruitgang.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kalender" className="btn-primary bg-white text-brand-900 hover:bg-ink-100">
              Volgende rit bekijken
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* UPCOMING RIDES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">Komende ritten</h2>
            <p className="text-sm text-ink-400 mt-1">
              {current ? 'Schrijf je in voor de volgende rit.' : 'Log in om je in te schrijven.'}
            </p>
          </div>
          <Link href="/kalender" className="text-sm text-brand-400 hover:text-brand-300 hidden sm:flex items-center gap-1">
            Alles bekijken <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!ridesWithMeta.length ? (
          <div className="card p-8 text-center text-ink-400">
            Nog geen ritten gepland. Bekijk de <Link href="/kalender" className="text-brand-400 hover:underline">kalender</Link>.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {ridesWithMeta.map(ride => (
              <RideCardCompact
                key={ride.id}
                ride={ride}
                currentUserId={current?.user?.id ?? null}
              />
            ))}
          </div>
        )}
      </section>

      {/* SPONSORS — opgesplitst in hoofdsponsors en gewone sponsors */}
      {(mainSponsors.length > 0 || regularSponsors.length > 0) && (
        <section className="border-t border-ink-800/50 bg-gradient-to-b from-ink-950 to-black py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-500 mb-2">
                Mede mogelijk gemaakt door
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">Onze sponsors</h2>
            </div>

            {/* Hoofdsponsors */}
            {mainSponsors.length > 0 && (
              <div className="mb-10">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-brand-400 font-medium text-center mb-4">
                  Hoofdsponsors
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {mainSponsors.map((sponsor: Sponsor) => (
                    <MainSponsorCard key={sponsor.id} sponsor={sponsor} />
                  ))}
                </div>
              </div>
            )}

            {/* Gewone sponsors */}
            {regularSponsors.length > 0 && (
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-ink-500 font-medium text-center mb-4">
                  Sponsors
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {regularSponsors.map((sponsor: Sponsor) => (
                    <RegularSponsorPill key={sponsor.id} sponsor={sponsor} />
                  ))}
                </div>
              </div>
            )}

            <div className="text-center mt-10">
              <Link href="/sponsors" className="text-sm text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                Bekijk alle sponsors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}


function MainSponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const content = (
    <>
      <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
      <p className="text-base font-medium text-white text-center">{sponsor.name}</p>
      {sponsor.website_url && (
        <p className="text-xs text-ink-500 text-center mt-1 flex items-center justify-center gap-1">
          {sponsor.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
          <ExternalLink className="h-3 w-3" />
        </p>
      )}
    </>
  );

  const className =
    'relative flex flex-col items-center justify-center bg-ink-900/60 border border-brand-700/40 hover:border-brand-600 hover:bg-ink-900 rounded-lg p-5 transition group w-48 h-24';

  if (sponsor.website_url) {
    return (
      <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}

function RegularSponsorPill({ sponsor }: { sponsor: Sponsor }) {
  const className =
    'text-sm sm:text-base text-ink-300 hover:text-white px-5 py-2 border border-ink-800 hover:border-ink-600 rounded-full transition';

  if (sponsor.website_url) {
    return (
      <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className={className}>
        {sponsor.name}
      </a>
    );
  }
  return <span className={className}>{sponsor.name}</span>;
}
