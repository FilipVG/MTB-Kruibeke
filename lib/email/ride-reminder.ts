interface RideInfo {
  title: string;
  start_at: string;
  start_location: string;
  ride_type: string;
  in_ranking: boolean;
  points: number;
  distance_km: number | null;
  description: string | null;
  id: string;
}

interface RankingEntry {
  place: number;
  name: string;
  total_points: number;
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

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function rideTypeLabel(type: string): string {
  if (type === 'mtb') return 'MTB';
  if (type === 'gravel') return 'Gravel';
  return 'Training op de baan';
}

function rideTypeEmoji(type: string): string {
  if (type === 'mtb') return '🚵';
  if (type === 'gravel') return '🚴';
  return '🏁';
}

export function buildRideReminderEmail(
  ride: RideInfo,
  top3: RankingEntry[],
  siteUrl: string,
  isRegistered = false,
  registeredNames: string[] = [],
): { subject: string; html: string } {
  const registerUrl = `${siteUrl}/kalender/${ride.id}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.start_location)}`;

  const podiumEmoji = ['🥇', '🥈', '🥉'];

  const rankingRows = top3.length > 0
    ? top3.map((e, i) => `
        <tr>
          <td style="padding:8px 12px;font-size:15px;">${podiumEmoji[i]}</td>
          <td style="padding:8px 12px;font-size:15px;color:#1a1a1a;">${e.name}</td>
          <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#b91c1c;text-align:right;">${e.total_points} pt</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:12px;color:#888;font-size:14px;text-align:center;">Nog geen klassement beschikbaar.</td></tr>`;

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
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;">Rituitnodiging</h2>
            <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
              Er staat een rit op de planning. Schrijf je snel in!
            </p>
          </td>
        </tr>

        <!-- Rit info -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="background:#b91c1c;padding:14px 20px;">
                  <h3 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${ride.title}</h3>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;font-size:14px;color:#666;width:120px;">📅 Datum</td>
                      <td style="padding:5px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-transform:capitalize;">${formatDate(ride.start_at)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:14px;color:#666;">🕐 Startuur</td>
                      <td style="padding:5px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${formatTime(ride.start_at)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:14px;color:#666;">📍 Locatie</td>
                      <td style="padding:5px 0;font-size:14px;"><a href="${mapsUrl}" style="color:#b91c1c;text-decoration:none;font-weight:600;">${ride.start_location}</a></td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:14px;color:#666;">🚵 Type</td>
                      <td style="padding:5px 0;font-size:14px;color:#1a1a1a;">${rideTypeLabel(ride.ride_type)}</td>
                    </tr>
                    ${ride.distance_km ? `<tr>
                      <td style="padding:5px 0;font-size:14px;color:#666;">📏 Afstand</td>
                      <td style="padding:5px 0;font-size:14px;color:#1a1a1a;">${ride.distance_km} km</td>
                    </tr>` : ''}
                    ${ride.in_ranking && ride.points > 0 ? `<tr>
                      <td style="padding:5px 0;font-size:14px;color:#666;">🏆 Klassement</td>
                      <td style="padding:5px 0;font-size:14px;color:#b91c1c;font-weight:700;">${ride.points} punten</td>
                    </tr>` : ''}
                  </table>
                  ${ride.description ? `<p style="margin:16px 0 0;font-size:14px;color:#555;line-height:1.7;border-top:1px solid #e5e7eb;padding-top:16px;">${ride.description}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            ${isRegistered
              ? `<a href="${registerUrl}" style="display:inline-block;background:#15803d;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
              ✓ Al ingeschreven
            </a>`
              : `<a href="${registerUrl}" style="display:inline-block;background:#b91c1c;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
              Ik kom af! →
            </a>`}
          </td>
        </tr>

        <!-- Ingeschrevenen -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="background:#f9fafb;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.1em;">✅ Ingeschreven (${registeredNames.length})</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;">
                  ${registeredNames.length > 0
                    ? registeredNames.map(name => `<span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;padding:4px 10px;border-radius:20px;margin:3px 3px;">${name}</span>`).join('')
                    : '<p style="margin:0;font-size:14px;color:#888;font-style:italic;">Nog niemand ingeschreven.</p>'}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Klassement -->
        <tr>
          <td style="padding:0 32px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr>
                <td colspan="3" style="background:#f9fafb;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.1em;">🏆 Klassement top 3 — ${new Date().getFullYear()}</p>
                </td>
              </tr>
              ${rankingRows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;">
              Je ontvangt deze mail omdat je rituitnodigingen hebt ingeschakeld.
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
    subject: `${rideTypeEmoji(ride.ride_type)} ${ride.title} — ${formatDate(ride.start_at)}`,
    html,
  };
}
