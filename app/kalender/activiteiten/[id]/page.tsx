import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, PartyPopper } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getDisplayName, getInitials } from '@/lib/utils';
import { ActivityRegistrationButton } from '@/components/activities/ActivityRegistrationButton';
import type { Profile } from '@/lib/types/database';

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTime(str: string) {
  return new Date(str).toLocaleTimeString('nl-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit', minute: '2-digit',
  });
}

interface ActivityRegistration {
  id: string;
  user_id: string;
  profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'>;
}

export default async function ActiviteitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const current = await getCurrentUser();

  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single();

  if (!activity) notFound();

  let registrations: ActivityRegistration[] = [];
  let isRegistered = false;

  if (current) {
    const { data } = await supabase
      .from('activity_registrations')
      .select('id, user_id, profile:profiles(id, nickname, first_name, last_name, avatar_url)')
      .eq('activity_id', id)
      .order('created_at', { ascending: true });

    registrations = (data as unknown as ActivityRegistration[]) ?? [];
    isRegistered = registrations.some(r => r.user_id === current.user.id);
  }

  const registrationFull =
    activity.max_participants !== null &&
    registrations.length >= activity.max_participants;

  const canRegister =
    activity.registration_required &&
    !activity.cancelled &&
    (!registrationFull || isRegistered) &&
    new Date(activity.start_at) > new Date();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <Link href="/kalender" className="text-sm text-ink-400 hover:text-white inline-flex items-center gap-1 mb-6">
        ← Kalender
      </Link>

      <div className="card p-6 sm:p-8 mt-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="badge bg-amber-900/40 text-amber-300 border border-amber-700/40">
            <PartyPopper className="h-3 w-3 mr-1" />
            Activiteit
          </span>
          {activity.cancelled && (
            <span className="badge bg-red-900/40 text-red-200 border border-red-800">Afgelast</span>
          )}
          {registrationFull && !isRegistered && (
            <span className="badge bg-ink-800 text-ink-400 border border-ink-700">Volzet</span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
          {activity.title}
        </h1>

        <div className="space-y-2 text-sm text-ink-400 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {formatDate(activity.start_at)}
              {activity.end_at && ` → ${formatTime(activity.end_at)}`}
            </span>
          </div>
          {activity.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{activity.location}</span>
            </a>
          )}
          {activity.registration_required && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>
                {registrations.length}
                {activity.max_participants ? ` / ${activity.max_participants}` : ''} ingeschreven
              </span>
            </div>
          )}
        </div>

        {activity.description && (
          <p className="text-sm text-ink-300 leading-relaxed whitespace-pre-line border-t border-ink-800 pt-5 mb-6">
            {activity.description}
          </p>
        )}

        {current && canRegister && (
          <div className="border-t border-ink-800 pt-5">
            <ActivityRegistrationButton
              activityId={id}
              isRegistered={isRegistered}
              currentUserId={current.user.id}
            />
          </div>
        )}

        {!current && activity.registration_required && !activity.cancelled && (
          <div className="border-t border-ink-800 pt-5">
            <Link href={`/auth/login?redirect=/kalender/activiteiten/${id}`} className="btn-primary">
              Inloggen om in te schrijven
            </Link>
          </div>
        )}
      </div>

      {current && activity.registration_required && registrations.length > 0 && (
        <div className="card p-6 mt-4">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-400" />
            Ingeschreven ({registrations.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {registrations.map(reg => (
              <Link
                key={reg.id}
                href={`/leden/${reg.profile.id}`}
                className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 rounded-full pl-1 pr-3 py-1 transition"
              >
                <Avatar profile={reg.profile} />
                <span className="text-sm text-ink-200">{getDisplayName(reg.profile)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ profile }: { profile: Pick<Profile, 'avatar_url' | 'first_name' | 'last_name' | 'nickname'> }) {
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-amber-700 flex items-center justify-center text-xs font-medium text-white">
      {getInitials(profile)}
    </div>
  );
}
