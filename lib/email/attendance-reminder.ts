interface PendingRide {
  id: string;
  title: string;
  start_at: string;
  pending_count: number;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Herinnering aan de admins om de aanwezigheden van een of meer ritten te
 * bevestigen. Wordt dagelijks verstuurd zolang er ritten openstaan.
 */
export function buildAttendanceReminderEmail(
  rides: PendingRide[],
  siteUrl: string,
): { subject: string; html: string } {
  const subject = rides.length === 1
    ? `Aanwezigheden bevestigen: ${rides[0].title}`
    : `Aanwezigheden bevestigen (${rides.length} ritten)`;

  const rows = rides.map(r => `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1a1a1a;">${r.title}</p>
        <p style="margin:0;font-size:13px;color:#666;text-transform:capitalize;">${formatDate(r.start_at)} · ${r.pending_count} nog te bevestigen</p>
      </td>
      <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
        <a href="${siteUrl}/admin/ritten/${r.id}" style="display:inline-block;background:#b91c1c;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:9px 16px;border-radius:6px;white-space:nowrap;">Bevestig</a>
      </td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#b91c1c;padding:28px 32px;">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;">Admin · MTB Kruibeke</p>
            <h1 style="margin:6px 0 0;font-size:24px;font-weight:700;color:#ffffff;">Aanwezigheden bevestigen</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 12px;">
            <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
              Voor onderstaande rit${rides.length === 1 ? '' : 'ten'} ${rides.length === 1 ? 'is' : 'zijn'} de aanwezigheden nog niet (volledig) bevestigd.
              Markeer elk ingeschreven lid als aanwezig of afwezig, zodat het klassement klopt.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:12px 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${rows}
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#1a1a1a;padding:20px 32px;">
            <p style="margin:0;font-size:12px;color:#888;text-align:center;">Je krijgt deze mail dagelijks tot de aanwezigheden bevestigd zijn.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
