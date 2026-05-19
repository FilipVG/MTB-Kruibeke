import { Mail, CheckCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getNewsletterData } from '@/lib/newsletter';
import { VerstuurKnop } from './VerstuurKnop';
import type { NewsletterRide, NewsletterActivity, NewsletterItemStatus } from '@/lib/newsletter';

export const metadata = { title: 'Off-Road Update — Admin' };

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function fmtDateShort(iso: string) {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(iso));
}

const STATUS_BADGE: Record<NewsletterItemStatus, { label: string; cls: string } | null> = {
  new: { label: 'Nieuw', cls: 'bg-green-900/40 text-green-300 border-green-800' },
  updated: { label: 'Gewijzigd', cls: 'bg-amber-900/40 text-amber-300 border-amber-800' },
  cancelled: { label: 'Afgelast', cls: 'bg-red-900/40 text-red-300 border-red-800' },
  existing: null,
};

function rideTypeLabel(type: string) {
  const map: Record<string, string> = { mtb: 'MTB', gravel: 'Gravel', jokerrit: 'Jokerrit', baanrit: 'Training' };
  return map[type] ?? type;
}

function StatusBadge({ status }: { status: NewsletterItemStatus }) {
  const cfg = STATUS_BADGE[status];
  if (!cfg) return null;
  return (
    <span className={`badge border text-xs ${cfg.cls}`}>{cfg.label}</span>
  );
}

function RideRow({ ride }: { ride: NewsletterRide }) {
  return (
    <div className={`flex items-start gap-3 py-3 px-4 border-b border-ink-800/60 last:border-0 ${ride.cancelled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <StatusBadge status={ride.status} />
          <span className="text-sm font-medium text-white truncate">{ride.title}</span>
        </div>
        <div className="text-xs text-ink-400 flex flex-wrap gap-x-3 mt-1">
          <span className="capitalize">{fmtDate(ride.start_at)}</span>
          <span>{ride.start_location}</span>
          <span>{rideTypeLabel(ride.ride_type)}</span>
          {ride.distance_km && <span>{ride.distance_km} km</span>}
          {ride.in_ranking && ride.points > 0 && <span className="text-amber-400">{ride.points} pt</span>}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: NewsletterActivity }) {
  return (
    <div className={`flex items-start gap-3 py-3 px-4 border-b border-ink-800/60 last:border-0 ${activity.cancelled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <StatusBadge status={activity.status} />
          <span className="text-sm font-medium text-white truncate">{activity.title}</span>
        </div>
        <div className="text-xs text-ink-400 flex flex-wrap gap-x-3 mt-1">
          <span className="capitalize">{fmtDate(activity.start_at)}</span>
          {activity.location && <span>{activity.location}</span>}
        </div>
      </div>
    </div>
  );
}

export default async function AdminNieuwsbriefPage() {
  const supabase = await createClient();
  const [data, { data: runs }, { data: settings }] = await Promise.all([
    getNewsletterData(supabase),
    supabase
      .from('newsletter_runs')
      .select('id, sent_at, recipient_count, test_mode, new_item_count')
      .order('sent_at', { ascending: false })
      .limit(10),
    supabase
      .from('newsletter_settings')
      .select('intro_text')
      .eq('id', 1)
      .maybeSingle(),
  ]);
  const introText: string = (settings as any)?.intro_text ?? '';

  const changedRides = data.rides.filter(r => r.status !== 'existing');
  const changedActivities = data.activities.filter(a => a.status !== 'existing');
  const totalChanged = changedRides.length + changedActivities.length;

  const referenceLabel = data.lastRun
    ? `Referentie: vorige verzending op ${fmtDate(data.lastRun.sent_at)}`
    : 'Nog nooit verstuurd — alles wordt als nieuw beschouwd';

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <Mail className="h-7 w-7 text-brand-500" />
          Off-Road Update
        </h1>
        <p className="text-sm text-ink-400 mt-1">{referenceLabel}</p>
      </div>

      {/* Komende nieuwsbrief — preview */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-800">
          <h2 className="font-semibold text-white">Komende nieuwsbrief</h2>
          <p className="text-xs text-ink-400 mt-0.5">
            {totalChanged > 0
              ? `${totalChanged} nieuwe/gewijzigde item${totalChanged !== 1 ? 's' : ''} · ${data.rides.length} ritt${data.rides.length !== 1 ? 'en' : ''} · ${data.activities.length} activiteit${data.activities.length !== 1 ? 'en' : ''} in de komende periode`
              : 'Geen nieuwe of gewijzigde items'}
          </p>
        </div>
        <div className="px-5 py-4 border-b border-ink-800">
          <VerstuurKnop canSend={totalChanged > 0} initialIntroText={introText} />
        </div>

        {/* Nieuwe / gewijzigde items — samenvatting */}
        {totalChanged > 0 && (
          <div className="px-5 py-3 bg-ink-900/60 border-b border-ink-800">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">Wat is er nieuw?</p>
            <div className="space-y-1.5">
              {[...changedRides, ...changedActivities]
                .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
                .map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <StatusBadge status={item.status} />
                    <span className="text-white font-medium">{item.title}</span>
                    <span className="text-ink-500 text-xs capitalize">{fmtDateShort(item.start_at)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Activiteiten */}
        {data.activities.length > 0 && (
          <div>
            <p className="px-4 py-2.5 text-xs font-medium text-ink-500 uppercase tracking-wide border-b border-ink-800 bg-ink-900/30">
              🎉 Activiteiten — komende 12 maanden ({data.activities.length})
            </p>
            {data.activities.map(a => <ActivityRow key={a.id} activity={a} />)}
          </div>
        )}

        {/* Ritten */}
        {data.rides.length > 0 && (
          <div>
            <p className="px-4 py-2.5 text-xs font-medium text-ink-500 uppercase tracking-wide border-b border-ink-800 bg-ink-900/30">
              🚵 Ritten — komende 3 maanden ({data.rides.length})
            </p>
            {data.rides.map(r => <RideRow key={r.id} ride={r} />)}
          </div>
        )}

        {data.rides.length === 0 && data.activities.length === 0 && (
          <p className="px-5 py-8 text-center text-ink-500 text-sm">
            Geen ritten of activiteiten gepland in de komende 12 maanden.
          </p>
        )}
      </section>

      {/* Geschiedenis */}
      {(runs ?? []).length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-400" />
              Verstuurgeschiedenis
            </h2>
          </div>
          <div className="divide-y divide-ink-800/60">
            {(runs ?? []).map((run: any) => (
              <div key={run.id} className="flex items-center justify-between px-5 py-3 gap-4 flex-wrap">
                <div className="text-sm">
                  <span className="text-white capitalize">{fmtDate(run.sent_at)}</span>
                  <span className="text-ink-500 ml-3">{run.new_item_count} nieuwe items</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {run.test_mode && (
                    <span className="badge bg-ink-800 text-ink-400 border-ink-700">testmodus</span>
                  )}
                  <span className="flex items-center gap-1 text-ink-400">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    {run.recipient_count} ontvanger{run.recipient_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
