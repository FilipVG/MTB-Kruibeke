# Handleiding MTB Kruibeke

## Inhoud

- [Gebruikershandleiding](#gebruikershandleiding)
  - [Inloggen](#inloggen)
  - [Wachtwoord vergeten](#wachtwoord-vergeten)
  - [Mijn profiel](#mijn-profiel)
  - [Kalender](#kalender)
  - [Inschrijven voor een rit](#inschrijven-voor-een-rit)
  - [Kalender abonneren](#kalender-abonneren)
  - [Klassement](#klassement)
  - [Wie is wie](#wie-is-wie)
- [Adminhandleiding](#adminhandleiding)
  - [Ritten beheren](#ritten-beheren)
  - [Aanwezigheid markeren](#aanwezigheid-markeren)
  - [Activiteiten beheren](#activiteiten-beheren)
  - [Leden beheren](#leden-beheren)
  - [Sponsors beheren](#sponsors-beheren)
  - [Klassement](#klassement-admin)

---

## Gebruikershandleiding

### Inloggen

1. Klik op **Inloggen** rechtsboven in de navigatiebalk.
2. Vul je **e-mailadres** en **wachtwoord** in.
3. Klik op **Inloggen**.

Je sessie blijft actief zolang je de site regelmatig bezoekt. Je wordt pas uitgelogd als je zelf klikt op **Uitloggen** (rechtsboven).

---

### Wachtwoord vergeten

1. Ga naar de loginpagina.
2. Klik op **Vergeten?** naast het wachtwoordveld.
3. Vul je e-mailadres in en klik op **Stuur resetlink**.
4. Je ontvangt een e-mail met een link. Klik op die link.
5. Vul een nieuw wachtwoord in (minimaal 8 tekens) en bevestig het.
6. Je wordt automatisch doorgestuurd naar je profiel.

> De resetlink is 24 uur geldig. Controleer ook je spammap als je geen mail ontvangt.

---

### Mijn profiel

Via **Mijn profiel** (rechtsboven na inloggen) kan je:

- Je **voornaam, familienaam en roepnaam** aanpassen
- Je **telefoonnummer** aanpassen
- Je **geboortedatum** aanpassen
- Je **profielfoto** uploaden of wijzigen (klik op het camera-icoontje)

Klik op **Opslaan** om wijzigingen te bewaren.

Onderaan de profielpagina zie je een overzicht van **jouw ritten dit jaar**:
- Toekomstige ritten waarvoor je ingeschreven bent — met een **Uitschrijven**-knop
- Ritten waaraan je hebt deelgenomen (groen vinkje)
- Ritten met punten tonen het aantal punten in het oranje

---

### Kalender

De kalender vind je via het menu bovenaan. Je ziet alle geplande ritten en activiteiten per maand.

- Gebruik de **pijlen** om naar een vorige of volgende maand te navigeren.
- Klik op de **titel van een rit** voor meer details.
- Als je niet ingelogd bent, zie je enkel de ritten. Activiteiten zijn enkel zichtbaar voor leden.

**Ritdetails** tonen:
- Datum, startuur en startlocatie (klikbaar naar Google Maps)
- Afstand en rittype (MTB / Gravel / Training)
- Of de rit meetelt voor het klassement en hoeveel punten
- Wie er ingeschreven is
- GPX-bestand om te downloaden (indien beschikbaar)

---

### Inschrijven voor een rit

**Op de homepage** (komende ritten):
- Klik op **Ik kom af!** op de ritkaart.

**Op de kalender**:
- Klik op de rit → klik op **Ik kom af!** op de detailpagina.

Om je **uit te schrijven**:
- Klik opnieuw op de knop (toont dan "Ingeschreven — klik om uit te schrijven").
- Of ga naar **Mijn profiel** en klik op **Uitschrijven** naast de rit.

> Inschrijven en uitschrijven is enkel mogelijk zolang de rit nog niet begonnen is en inschrijvingen open zijn.

---

### Kalender abonneren

Je kan de kalender importeren in Google Calendar, Apple Agenda of Outlook zodat alle ritten automatisch in je agenda verschijnen.

1. Klik op **Abonneer op kalender** (op de kalenderpagina of in de footer).
2. Kopieer de getoonde URL.
3. Voeg die URL toe als **abonnement** (niet importeer!) in je agenda-app:
   - **Google Calendar**: Andere agenda's → Via URL toevoegen
   - **Apple Agenda**: Bestand → Nieuw kalenderabonnement
   - **Outlook**: Kalender toevoegen → Via internet

De kalender synchroniseert automatisch. Nieuwe ritten en wijzigingen verschijnen vanzelf.

---

### Klassement

Het puntenklassement vind je via het menu. Punten worden toegekend als:
1. De rit is aangemerkt als "telt voor klassement"
2. De admin heeft je aanwezigheid bevestigd na de rit

Bovenaan de pagina kan je een **jaar selecteren** om klassementen van vorige jaren te raadplegen. Het klassement wordt automatisch gereset op 1 januari.

---

### Wie is wie

Via **Leden** in het menu zie je alle actieve leden. Klik op een lid voor:
- Profielfoto, naam en eventuele bio
- E-mailadres en telefoonnummer
- Laatste bezoek aan de site
- Ritten dit jaar (deelgenomen en geplande ritten)

---

## Adminhandleiding

Als administrator heb je toegang tot het **Admin center** via het menu bovenaan.

---

### Ritten beheren

#### Nieuwe rit aanmaken

1. Ga naar **Admin → Ritten → Nieuwe rit**.
2. Vul in:
   - **Titel**: naam van de rit
   - **Type**: MTB / Gravel / Training op de baan
   - **Datum & startuur**: kies datum en tijd (Brussels tijdzone)
   - **Startlocatie**: adres of plaatsnaam
   - **Afstand**: optioneel, in km
   - **Omschrijving**: extra info
   - **GPX-bestand**: optioneel, upload een .gpx bestand
   - **Telt mee voor puntenklassement**: vink aan indien van toepassing
   - **Punten**: 1 t.e.m. 5 (5-puntenritten worden extra in de verf gezet)
3. Klik op **Rit aanmaken**.

> Standaard: MTB start met klassement aangevinkt (2 punten). Gravel en Training starten zonder klassement.

#### Rit bewerken

1. Ga naar **Admin → Ritten** en klik op de rit.
2. Pas de gewenste velden aan en klik op **Opslaan**.

#### Rit annuleren of verwijderen

Onderaan de bewerkingspagina vind je:
- **Annuleren**: de rit verdwijnt uit de kalender maar blijft in de database.
- **Verwijderen**: de rit wordt permanent verwijderd (inclusief alle inschrijvingen).

#### Inschrijvingen beheren

Op de bewerkingspagina van een rit zie je alle ingeschreven leden. Je kan:
- Een lid **toevoegen** via het dropdown-menu onderaan de lijst.
- Een lid **verwijderen** via het prullenbak-icoontje naast de naam.

---

### Aanwezigheid markeren

Na een rit moet je de aanwezigheid bevestigen zodat punten worden toegekend.

1. Ga naar **Admin → Ritten** en klik op de rit.
2. In de deelnemerslijst klik je op het **vinkje** naast elk aanwezig lid.
3. Een groen vinkje = aanwezig (telt mee voor klassement).
4. Een rood kruis = niet aanwezig.

> Zonder aanwezigheidsmarkering worden er geen punten toegekend, ook al is de rit ingesteld als klassementsrit.

---

### Activiteiten beheren

Activiteiten zijn niet-ritten (BBQ, vergadering, uitstap…) en zijn enkel zichtbaar voor ingelogde leden.

#### Nieuwe activiteit aanmaken

1. Ga naar **Admin → Activiteiten → Nieuwe activiteit**.
2. Vul in:
   - **Titel**
   - **Startdatum & -uur** en optioneel **einddatum & -uur**
   - **Locatie** (optioneel)
   - **Omschrijving** (optioneel)
   - **Inschrijving vereist**: vink aan als leden zich moeten inschrijven
   - **Max. deelnemers**: optioneel
3. Klik op **Activiteit aanmaken**.

#### Activiteit bewerken of verwijderen

Ga naar **Admin → Activiteiten**, klik op de activiteit en pas aan of verwijder.

---

### Leden beheren

#### Nieuw lid aanmaken

1. Ga naar **Admin → Leden → Nieuw lid**.
2. Vul voornaam, familienaam en e-mailadres in.
3. Stel een tijdelijk wachtwoord in.
4. Klik op **Lid aanmaken**.

Het lid ontvangt een account en kan meteen inloggen. Stuur daarna eventueel een wachtwoordresetlink door zodat het lid zelf een wachtwoord kan kiezen.

#### Lid bewerken

1. Ga naar **Admin → Leden** en klik op het lid.
2. Aanpasbare velden: naam, roepnaam, telefoon, geboortedatum, bio, rol en profielfoto.
3. Klik op **Opslaan**.

> E-mailadres kan niet gewijzigd worden.

#### Profielfoto wijzigen

Op de bewerkingspagina van een lid:
1. Klik op het **camera-icoontje** op de avatar.
2. Kies een afbeelding (JPG of PNG, max. 2 MB).
3. Klik op **Opslaan** — de foto wordt geüpload en opgeslagen.

#### Wachtwoord resetten

Op de bewerkingspagina van een lid:
1. Klik op **Genereer resetlink** in de sectie "Wachtwoord resetten".
2. Kopieer de gegenereerde link.
3. Stuur de link door naar het lid (via WhatsApp, e-mail…).
4. Het lid klikt op de link en stelt een nieuw wachtwoord in.

> De resetlink is 24 uur geldig en eenmalig bruikbaar.

#### Lid deactiveren of reactiveren

Onderaan de bewerkingspagina:
- **Deactiveren**: het lid verdwijnt uit de ledenlijst en kan niet meer inloggen. De account blijft bewaard.
- **Reactiveren**: het lid wordt terug actief gezet.

#### Rol instellen

Een lid kan de rol **Lid** of **Admin** krijgen. Admins hebben toegang tot het volledige beheercentrum.

---

### Sponsors beheren

#### Nieuwe sponsor aanmaken

1. Ga naar **Admin → Sponsors → Nieuwe sponsor**.
2. Vul in:
   - **Naam**
   - **Type**: Hoofdsponsor of Gewone sponsor
   - **Website** (optioneel)
   - **Omschrijving** (optioneel)
   - **Logo** (optioneel, JPG/PNG)
   - **Volgorde**: bepaalt de sortering binnen het type
3. Klik op **Sponsor aanmaken**.

Hoofdsponsors verschijnen groter op de homepage. Gewone sponsors verschijnen als pills.

#### Sponsor bewerken of verwijderen

Ga naar **Admin → Sponsors**, klik op de sponsor en pas aan of verwijder.

---

### Klassement (admin)

Het klassement wordt automatisch berekend op basis van:
- Ritten waarbij **"Telt voor klassement"** is aangevinkt
- Leden waarbij de admin **aanwezigheid heeft bevestigd** (vinkje in de deelnemerslijst)

Het klassement reset automatisch op **1 januari**. Vorige jaren blijven raadpleegbaar via de jaarselector op de klassementspagina.

**Opgelet**: als je vergeet aanwezigheid te markeren, worden er geen punten toegekend. Dit kan je achteraf rechtzetten door alsnog de vinkjes in te stellen.
