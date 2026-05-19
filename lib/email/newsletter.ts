import type { NewsletterRide, NewsletterActivity } from '@/lib/newsletter';

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function rideTypeLabel(type: string): string {
  const map: Record<string, string> = {
    mtb: '🚵 MTB', gravel: '🚴 Gravel', jokerrit: '🤡 Jokerrit', baanrit: '🏁 Training',
  };
  return map[type] ?? type;
}

function statusBadge(status: string): string {
  if (status === 'new') {
    return '<span style="display:inline-block;background:#15803d;color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;letter-spacing:0.05em;vertical-align:middle;">NIEUW</span>';
  }
  if (status === 'updated') {
    return '<span style="display:inline-block;background:#b45309;color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;letter-spacing:0.05em;vertical-align:middle;">GEWIJZIGD</span>';
  }
  if (status === 'cancelled') {
    return '<span style="display:inline-block;background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;letter-spacing:0.05em;vertical-align:middle;">AFGELAST</span>';
  }
  return '';
}

function rideRow(r: NewsletterRide, siteUrl: string): string {
  const badge = r.status !== 'existing' ? statusBadge(r.status) : '';
  const titleColor = r.cancelled ? '#9ca3af' : '#111827';
  const titleDecor = r.cancelled ? 'line-through' : 'none';
  return `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        ${badge ? `<div style="margin-bottom:6px;">${badge}</div>` : ''}
        <div>
          <a href="${siteUrl}/kalender/${r.id}"
             style="font-size:15px;font-weight:700;color:${titleColor};text-decoration:${titleDecor};">${r.title}</a>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin-top:5px;">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding-right:12px;white-space:nowrap;">
              📅 <span style="text-transform:capitalize;">${fmtDate(r.start_at)}</span>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding-top:2px;">
              📍 ${r.start_location}${r.distance_km ? `&nbsp;·&nbsp;📏 ${r.distance_km}&nbsp;km` : ''}
              &nbsp;·&nbsp;${rideTypeLabel(r.ride_type)}
              ${r.in_ranking && r.points > 0 ? `&nbsp;·&nbsp;<span style="color:#b91c1c;font-weight:600;">🏆 ${r.points} pt</span>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function activityRow(a: NewsletterActivity, siteUrl: string): string {
  const badge = a.status !== 'existing' ? statusBadge(a.status) : '';
  const titleColor = a.cancelled ? '#9ca3af' : '#111827';
  const titleDecor = a.cancelled ? 'line-through' : 'none';
  const endTime = a.end_at ? ` → ${fmtTime(a.end_at)}` : '';
  return `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        ${badge ? `<div style="margin-bottom:6px;">${badge}</div>` : ''}
        <div>
          <a href="${siteUrl}/kalender/activiteiten/${a.id}"
             style="font-size:15px;font-weight:700;color:${titleColor};text-decoration:${titleDecor};">${a.title}</a>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin-top:5px;">
          <tr>
            <td style="font-size:13px;color:#6b7280;">
              📅 <span style="text-transform:capitalize;">${fmtDate(a.start_at)}${endTime}</span>
            </td>
          </tr>
          ${a.location ? `<tr><td style="font-size:13px;color:#6b7280;padding-top:2px;">📍 ${a.location}</td></tr>` : ''}
        </table>
      </td>
    </tr>`;
}

export function buildNewsletterEmail(
  rides: NewsletterRide[],
  activities: NewsletterActivity[],
  siteUrl: string,
): { subject: string; html: string } {
  const changedItems = [...rides, ...activities]
    .filter(i => i.status !== 'existing')
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const changedSection = changedItems.length > 0 ? `
        <tr>
          <td style="padding:28px 32px 0;">
            <h2 style="margin:0 0 14px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.1em;">
              Wat is er nieuw?
            </h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#f9fafb;">
              ${changedItems.map(item => {
                const isRide = 'ride_type' in item;
                const link = isRide
                  ? `${siteUrl}/kalender/${item.id}`
                  : `${siteUrl}/kalender/activiteiten/${item.id}`;
                return `<tr>
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">
                    ${statusBadge(item.status)}
                    &nbsp;<a href="${link}" style="font-size:14px;font-weight:600;color:#111827;text-decoration:none;">${item.title}</a>
                    <span style="font-size:13px;color:#9ca3af;">&nbsp;—&nbsp;<span style="text-transform:capitalize;">${fmtDate(item.start_at)}</span></span>
                  </td>
                </tr>`;
              }).join('')}
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#e5e7eb;margin:24px 0 0;"></div></td></tr>
  ` : '';

  const ridesSection = rides.length > 0 ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">🚵 Ritten <span style="font-size:13px;font-weight:400;color:#9ca3af;">(${rides.length})</span></h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${rides.map(r => rideRow(r, siteUrl)).join('')}
            </table>
          </td>
        </tr>
  ` : '';

  const activitiesSection = activities.length > 0 ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">🎉 Activiteiten <span style="font-size:13px;font-weight:400;color:#9ca3af;">(${activities.length})</span></h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${activities.map(a => activityRow(a, siteUrl)).join('')}
            </table>
          </td>
        </tr>
  ` : '';

  const emptySection = rides.length === 0 && activities.length === 0 ? `
        <tr>
          <td style="padding:40px 32px;text-align:center;color:#9ca3af;font-size:15px;">
            Geen ritten of activiteiten gepland in de komende 12 maanden.
          </td>
        </tr>
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Off-Road Update — MTB Kruibeke</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:28px 32px;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.2em;text-transform:uppercase;">Mountainbike club · Waasland</p>
            <h1 style="margin:6px 0 0;font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Off-Road Update</h1>
            <p style="margin:5px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">
              MTB Kruibeke &mdash; agenda komende 12 maanden
            </p>
          </td>
        </tr>

        ${changedSection}
        ${ridesSection}
        ${activitiesSection}
        ${emptySection}

        <!-- Login notice -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;">
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.6;">
                  🔒 De links in deze mail leiden naar de ledenzone van mtbkruibeke.be.
                  Zorg dat je ingelogd bent om alle details te bekijken.
                  &nbsp;<a href="${siteUrl}/auth/login" style="color:#b91c1c;text-decoration:none;font-weight:600;">Inloggen &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;margin-top:24px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 5px;font-size:12px;color:#9ca3af;">
              Je ontvangt deze Off-Road Update als lid van MTB Kruibeke.
            </p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              <a href="${siteUrl}/profiel" style="color:#b91c1c;text-decoration:none;">Afmelden</a>
              &nbsp;&middot;&nbsp;
              <a href="${siteUrl}" style="color:#b91c1c;text-decoration:none;">mtbkruibeke.be</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = changedItems.length === 1
    ? `📬 Off-Road Update — ${changedItems[0].title}`
    : `📬 Off-Road Update — ${changedItems.length} nieuwe items op de agenda`;

  return { subject, html };
}
