import { formatRating } from '@/lib/reviews';

/**
 * Toont de gemiddelde reviewscore na een rit-naam, bv. ★ 4,2.
 * Rendert niets als er geen reviews zijn. Bruikbaar in server- en clientcomponenten.
 */
export function RatingBadge({
  avg,
  count,
  className = 'inline-flex items-center gap-0.5 text-xs font-medium text-amber-400 shrink-0',
}: {
  avg: number;
  count: number;
  className?: string;
}) {
  if (!count || !avg) return null;
  return (
    <span
      title={`Gemiddeld ${formatRating(avg)} / 5 · ${count} beoordeling${count !== 1 ? 'en' : ''}`}
      className={className}
    >
      <span aria-hidden>★</span>
      {formatRating(avg)}
    </span>
  );
}
