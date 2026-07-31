interface RideInfo {
  id: string;
  title: string;
  start_at: string;
  ride_type: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function rideTypeEmoji(type: string): string {
  if (type === 'mtb') return '🚵';
  if (type === 'gravel') return '🚴';
  if (type === 'jokerrit') return '🤡';
  return '🏁';
}

/**
 * Herinnering die ~8u na de start van een rit naar de deelnemers gaat met de
 * vraag om een review (score + opmerking) achter te laten. De knop linkt
 * rechtstreeks naar de reviews-sectie van de rit.
 */
export function buildReviewReminderEmail(
  ride: RideInfo,
  siteUrl: string,
): { subject: string; html: string } {
  const reviewUrl = `${siteUrl}/kalender/${ride.id}#reviews`;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#b91c1c;padding:28px 32px;">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;">Mountainbike club · Waasland</p>
            <h1 style="margin:6px 0 0;font-size:26px;font-weight:700;color:#ffffff;">MTB Kruibeke</h1>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:32px 32px 0;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;">Hoe was de rit?</h2>
            <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
              Je reed mee met <strong style="color:#1a1a1a;">${ride.title}</strong> van <span style="text-transform:capitalize;">${formatDate(ride.start_at)}</span>.
              Laat de anderen weten hoe het was — geef een score en (optioneel) een woordje uitleg.
            </p>
          </td>
        </tr>

        <!-- Sterren -->
        <tr>
          <td style="padding:20px 32px 0;text-align:center;">
            <p style="margin:0;font-size:34px;letter-spacing:4px;">⭐️⭐️⭐️⭐️⭐️</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:20px 32px 32px;text-align:center;">
            <a href="${reviewUrl}" style="display:inline-block;background:#f59e0b;color:#1a1a1a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
              Geef een review →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;">
              Je ontvangt deze mail omdat je review-herinneringen hebt ingeschakeld.
            </p>
            <p style="margin:0;font-size:12px;color:#999;">
              <a href="${siteUrl}/profiel" style="color:#b91c1c;text-decoration:none;">Voorkeuren wijzigen</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}" style="color:#b91c1c;text-decoration:none;">mtbkruibeke.be</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `${rideTypeEmoji(ride.ride_type)} Hoe was ${ride.title}? Laat een review achter`,
    html,
  };
}
