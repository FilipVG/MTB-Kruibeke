'use client';

import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getDisplayName, getInitials } from '@/lib/utils';
import type { Profile } from '@/lib/types/database';

interface Review {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'>;
}

interface Props {
  rideId: string;
  initialReviews: Review[];
  currentUserId: string | null;
}

function Stars({ score, interactive = false, onSelect }: {
  score: number;
  interactive?: boolean;
  onSelect?: (s: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => onSelect?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              s <= (hover || score)
                ? 'fill-amber-400 text-amber-400'
                : 'text-ink-700'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function RideReviews({ rideId, initialReviews, currentUserId }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [score, setScore] = useState(() => initialReviews.find(r => r.user_id === currentUserId)?.score ?? 0);
  const [comment, setComment] = useState(() => initialReviews.find(r => r.user_id === currentUserId)?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myReview = reviews.find(r => r.user_id === currentUserId);
  const avgScore = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === 0) { setError('Kies een score.'); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { data, error: err } = await supabase
      .from('ride_reviews')
      .upsert({ ride_id: rideId, user_id: currentUserId!, score, comment: comment || null }, { onConflict: 'ride_id,user_id' })
      .select('id, score, comment, created_at, user_id, profile:profiles(id, nickname, first_name, last_name, avatar_url)')
      .single();

    setSaving(false);
    if (err) { setError(err.message); return; }

    setReviews(prev => {
      const without = prev.filter(r => r.user_id !== currentUserId);
      return [data as unknown as Review, ...without].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from('ride_reviews').delete().eq('ride_id', rideId).eq('user_id', currentUserId!);
    setReviews(prev => prev.filter(r => r.user_id !== currentUserId));
    setScore(0);
    setComment('');
  }

  return (
    <div className="card p-6 mt-4">
      <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-ink-400" />
        Reviews
        {avgScore !== null && (
          <span className="ml-1 text-sm font-normal text-ink-400">
            — gem. <span className="text-amber-400 font-medium">{avgScore.toFixed(1)}</span>/5
            <span className="text-ink-600 ml-1">({reviews.length})</span>
          </span>
        )}
      </h2>

      {/* Formulier voor ingelogd lid */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="mb-5 pb-5 border-b border-ink-800">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">
            {myReview ? 'Jouw review' : 'Schrijf een review'}
          </p>
          <div className="flex items-center gap-3 mb-3">
            <Stars score={score} interactive onSelect={setScore} />
            {score > 0 && <span className="text-xs text-ink-400">{score}/5</span>}
          </div>
          <textarea
            className="input min-h-[72px] text-sm mb-3"
            placeholder="Optionele opmerking over de rit…"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving || score === 0} className="btn-primary disabled:opacity-40">
              {saving ? 'Opslaan…' : myReview ? 'Bijwerken' : 'Opslaan'}
            </button>
            {myReview && (
              <button type="button" onClick={handleDelete} className="btn-secondary text-red-400 hover:text-red-300">
                Verwijderen
              </button>
            )}
          </div>
        </form>
      )}

      {/* Overzicht */}
      {reviews.length === 0 ? (
        <p className="text-sm text-ink-500">Nog geen reviews.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="flex gap-3">
              <ReviewAvatar profile={r.profile} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <a href={`/leden/${r.profile.id}`} className="text-sm font-medium text-ink-200 hover:text-white transition">
                    {getDisplayName(r.profile)}
                  </a>
                  <Stars score={r.score} />
                </div>
                {r.comment && <p className="text-sm text-ink-400 leading-relaxed">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewAvatar({ profile }: { profile: Review['profile'] }) {
  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5" />;
  }
  return (
    <div className="h-8 w-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-medium text-white shrink-0 mt-0.5">
      {getInitials(profile)}
    </div>
  );
}
