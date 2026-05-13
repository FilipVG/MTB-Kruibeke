import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Trophy, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatRideDate } from '@/lib/utils';
import type { Ride, Sponsor } from '@/lib/types/database';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: upcomingRides } = await supabase
    .from('rides')
    .select('*')
    .gte('start_at', new Date().toISOString())
    .eq('cancelled', false)
    .order('start_at', { ascending: true })
    .limit(3);

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
            <Link href="/lid-worden" className="btn-secondary border-white/30 text-white hover:bg-white/10">
              Lid worden
            </Link>
          </div>
        </div>
      </section>

      {/* UPCOMING RIDES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">Komende ritten</h2>
            <p className="text-sm text-ink-400 mt-1">Schrijf je in via de kalender.</p>
          </div>
          <Link href="/kalender" className="text-sm text-brand-400 hover:text-brand-300 hidden sm:flex items-center gap-1">
            Alles bekijken <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!upcomingRides?.length ? (
          <div className="card p-8 text-center text-ink-400">
            Nog geen ritten gepland. Bekijk de <Link href="/kalender" className="text-brand-400 hover:underline">kalender</Link>.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingRides.map((ride: Ride) => (
              <RideCard key={ride.id} ride={ride} />
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

function RideCard({ ride }: { ride: Ride }) {
  return (
    <Link href={`/kalender#rit-${ride.id}`} className="card p-5 hover:border-brand-700/50 hover:bg-ink-900/60 transition group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className={ride.ride_type === 'mtb' ? 'badge-mtb' : 'badge-gravel'}>
            {ride.ride_type === 'mtb' ? 'MTB' : 'Gravel'}
          </span>
          {ride.in_ranking && ride.points > 0 && (
            <span className="badge bg-brand-700/20 text-brand-200 border border-brand-700/30">
              <Trophy className="h-3 w-3 mr-1" />
              {ride.points} pt
            </span>
          )}
        </div>
      </div>
      <h3 className="font-medium text-white group-hover:text-brand-100 transition">
        {ride.title}
      </h3>
      <div className="mt-3 space-y-1.5 text-sm text-ink-400">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatRideDate(ride.start_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ride.start_location}</span>
        </div>
      </div>
    </Link>
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
    'relative block bg-ink-900/60 border border-brand-700/40 hover:border-brand-600 hover:bg-ink-900 rounded-lg p-5 transition group';

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
