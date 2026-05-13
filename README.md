# MTB Kruibeke website

Moderne ledenwebsite voor MTB Kruibeke. Gebouwd met Next.js 15, Supabase, Tailwind CSS en gehost op Vercel.

## Functionaliteit

### Publiek
- **Home** — overzicht van de club en eerstvolgende ritten
- **Kalender** — alle geplande ritten en activiteiten, met iCal-abonnement (`/api/calendar.ics`)
- **Sponsors** — overzicht van clubsponsors
- **Lid worden** — info en aanvraagformulier

### Voor leden (na inloggen)
- **Profiel** — eigen foto, roepnaam en bio beheren
- **Inschrijven** — voor ritten en activiteiten tot aan de starttijd
- **Wie is wie** — alle leden met hun profielfoto en bio
- **Klassement** — actueel puntenklassement van het seizoen
- **Archief** — voorbije activiteiten

### Voor administrators
- Ritten beheren (aanmaken, GPX uploaden, punten toekennen)
- Leden beheren (rollen toekennen, inschrijvingen aanpassen)
- Sponsors en activiteiten beheren

## Lokale setup

```bash
# 1. Installeer dependencies
npm install

# 2. Kopieer omgevingsvariabelen en vul in
cp .env.example .env.local

# 3. Start lokale dev server
npm run dev
```

Open vervolgens http://localhost:3000.

## Supabase instellen

1. Maak een nieuw project op [supabase.com](https://supabase.com)
2. Ga naar **Project Settings → API** en kopieer:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` 
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (alleen server-side!)
3. Ga naar **SQL Editor** en draai het script in `supabase/migrations/001_initial_schema.sql`
4. Ga naar **Storage** en maak twee buckets aan:
   - `avatars` (public)
   - `gpx` (public)
   - `sponsors` (public)

## Deployen naar Vercel

```bash
# Push naar GitHub, dan
vercel --prod
```

Stel in de Vercel-dashboard dezelfde environment variables in als in `.env.local`.

## Projectstructuur

```
app/
  page.tsx                  → Home
  kalender/                 → Publieke kalender
  klassement/               → Puntenklassement (leden)
  leden/                    → Wie is wie (leden)
  sponsors/                 → Sponsors
  lid-worden/               → Lid worden info
  profiel/                  → Eigen profiel bewerken
  auth/                     → Login/registratie
  admin/                    → Admin paneel
  api/
    calendar.ics/           → iCal feed
    rides/                  → Rit API endpoints

components/                 → React componenten
lib/
  supabase/                 → Supabase clients (server + browser)
  types/                    → TypeScript types
  utils/                    → Helpers

supabase/
  migrations/               → SQL migraties
```

## Rollen

- `member` — standaard, kan eigen profiel beheren en in/uitschrijven
- `admin` — kan alles beheren (ritten, leden, sponsors, klassement)
