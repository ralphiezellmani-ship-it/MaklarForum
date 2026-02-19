# Maklarforum.se

Fullstack grund for Maklarforum enligt produktspec v2.0 (februari 2026).

## Ingar i denna version
- Supabase auth (login, registrering konsument/maklare, logout)
- Rollstyrda dashboards (konsument, maklare, admin)
- Admin-funktioner: verifiera maklare, neka, ta bort konto, byt maklarens e-post med bevarat profil-id
- Publik Q&A och maklarprofiler med live-data mot Supabase (fallback till mockdata lokalt)
- Modereringsfilter i svarsflode
- Stripe Premium checkout endpoint + webhook sync
- Fortnox sync-ko (db-tabell) for invoice-events
- Juridiksidor, guider, ordlista och SEO-grund

## Snabbstart
```bash
npm install
npm run dev
```

Oppna [http://localhost:3000](http://localhost:3000).

## Miljovariabler
Kopiera `.env.example` till `.env.local` och fyll i:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_PRICE_ID`
- `NEXT_PUBLIC_SITE_URL`

## Databas
Kor migrationerna i ordning:
- `supabase/migrations/20260218_init.sql`
- `supabase/migrations/20260218_billing.sql`

Promotera ditt konto till admin efter forsta inloggningen:
- Kor `supabase/sql/promote_admin.sql` och byt e-post till din riktiga adress.

## Viktiga routes
- `/login`
- `/register/consumer`
- `/register/maklare`
- `/fragor` och `/fragor/[slug]`
- `/maklare` och `/maklare/[slug]`
- `/dashboard/konsument`
- `/dashboard/maklare`
- `/admin`
- `/priser`

## Stripe setup
1. Skapa produkt + pris i Stripe (manadsplan Premium).
2. Satt `STRIPE_PREMIUM_PRICE_ID`.
3. Satt webhook endpoint till `/api/stripe/webhook` och lyssna pa:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Checkout startas fran `/priser` nar inloggad maklare klickar "Aktivera Premium".

## Fortnox
Webhooken skapar poster i `fortnox_sync_queue` for invoice-events.
Nasta steg ar worker som plockar pending-poster och skickar till Fortnox API.

## Kommentar
Nuvarande implementation ar produktionsredo i struktur och auth/dataflode.
Kvarvarande integrationer ar Fortnox worker och Resend mallar/notisleverans.
