/**
 * Afzender en contact-/antwoordadres voor alle clubmails, op één plek.
 *
 * Zonder Reply-To belandde een antwoord op het noreply-adres, waar niemand
 * meeleest. Alle uitgaande mails verwijzen nu naar het bestuursadres, zodat een
 * lid dat gewoon op "beantwoorden" drukt bij een echt persoon terechtkomt.
 * Beide waarden zijn via omgevingsvariabelen aanpasbaar zonder nieuwe deploy.
 */

export const MAIL_FROM = process.env.RESEND_FROM ?? 'MTB Kruibeke <noreply@mtbkruibeke.be>';

/** Publiek contactadres van de club — ook gebruikt voor mailto-links op de site. */
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'bestuur@mtbkruibeke.be';

export const REPLY_TO = CONTACT_EMAIL;
