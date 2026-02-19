# Mäklarforum.se — Claude Code Master Prompt

## Vad vi bygger

Mäklarforum.se är en tvåsidig plattform där:
- **Konsumenter** ställer frågor om bostadsmarknaden och får svar av verifierade proffs
- **Yrkesprofessionella** (mäklare, banker, besiktningsmän, hantverkare, kommuner) svarar på frågor, bygger sin profil och nätverkar i ett internt forum

**Primärt mål fas 1:** Bygga organisk trafik via SEO-indexerad Q&A så att vi sedan kan sälja en leadsprenumeration (3 000 kr/mån) till mäklarkontor.

---

## Tech Stack

- **Framework:** Next.js 14 med App Router
- **Databas & Auth:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Hosting:** Vercel
- **Email:** Resend
- **Betalning:** Stripe (fas 2)
- **Bokföring:** Fortnox via Stripe-integration (fas 2)
- **Styling:** Tailwind CSS
- **Språk:** TypeScript
- **Formulär:** React Hook Form + Zod

---

## Projektstruktur vi ska bygga

```
maklarforum/
├── app/
│   ├── (public)/                    # Publika sidor utan auth
│   │   ├── page.tsx                 # Startsida
│   │   ├── fragor/
│   │   │   ├── page.tsx             # Alla frågor (SEO-lista)
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx         # Enskild fråga + svar (SSR för SEO)
│   │   │   └── ny/
│   │   │       └── page.tsx         # Ställ en fråga
│   │   ├── proffs/
│   │   │   ├── page.tsx             # Lista alla verifierade proffs
│   │   │   └── [slug]/
│   │   │       └── page.tsx         # Profilsida (SSR för SEO)
│   │   ├── kategorier/
│   │   │   └── [category]/
│   │   │       └── page.tsx         # Frågor per kategori
│   │   ├── omraden/
│   │   │   └── [municipality]/
│   │   │       └── page.tsx         # Frågor per kommun
│   │   ├── guider/
│   │   │   ├── kopa/
│   │   │   │   └── page.tsx         # Guide för köpare
│   │   │   └── salja/
│   │   │       └── page.tsx         # Guide för säljare
│   │   └── marknadsdata/
│   │       └── [municipality]/
│   │           └── page.tsx         # Lokal marknadsdata
│   ├── (auth)/                      # Auth-flöden
│   │   ├── logga-in/
│   │   │   └── page.tsx
│   │   ├── registrera/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts             # Supabase auth callback
│   ├── (consumer)/                  # Inloggad konsument
│   │   ├── layout.tsx
│   │   └── mina-fragor/
│   │       └── page.tsx
│   ├── (professional)/              # Inloggat proffs (verifierat)
│   │   ├── layout.tsx               # Middleware-skyddad
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Proffs-dashboard med statistik
│   │   ├── profil/
│   │   │   └── page.tsx             # Redigera profil
│   │   ├── svar/
│   │   │   └── page.tsx             # Alla frågor att svara på
│   │   ├── meddelanden/
│   │   │   └── page.tsx
│   │   ├── objekt/
│   │   │   └── page.tsx             # Hantera listings
│   │   └── forum/
│   │       ├── page.tsx             # Internt mäklarforum
│   │       └── [slug]/
│   │           └── page.tsx
│   ├── (admin)/                     # Admin-panel
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx             # Dashboard
│   │       ├── verifieringar/
│   │       │   └── page.tsx         # Godkänn/neka mäklare
│   │       └── rapporter/
│   │           └── page.tsx
│   ├── api/
│   │   ├── questions/
│   │   │   └── route.ts
│   │   ├── answers/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── layout.tsx                   # Root layout
│   ├── sitemap.ts                   # Auto-genererad sitemap
│   └── robots.ts
├── components/
│   ├── ui/                          # Generiska UI-komponenter
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── Avatar.tsx
│   ├── questions/
│   │   ├── QuestionCard.tsx
│   │   ├── QuestionForm.tsx
│   │   ├── QuestionList.tsx
│   │   └── GeoScopeSelector.tsx
│   ├── answers/
│   │   ├── AnswerCard.tsx
│   │   ├── AnswerForm.tsx
│   │   └── AnswerList.tsx
│   ├── profiles/
│   │   ├── ProProfile.tsx
│   │   ├── ProCard.tsx
│   │   └── VerificationBadge.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   └── seo/
│       └── JsonLd.tsx               # Structured data för Google
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client (SSR)
│   │   └── middleware.ts
│   ├── types/
│   │   └── database.types.ts        # Auto-genererade Supabase-typer
│   ├── utils/
│   │   ├── slug.ts
│   │   ├── municipalities.ts        # Lista över svenska kommuner
│   │   └── categories.ts
│   └── validations/
│       ├── question.schema.ts
│       ├── answer.schema.ts
│       └── professional.schema.ts
├── supabase/
│   ├── schema.sql                   # Hela databasen
│   ├── seed.sql                     # Testdata
│   └── edge-functions/
│       ├── notify-professionals/    # Skicka notis vid ny fråga
│       │   └── index.ts
│       └── send-email/              # Email via Resend
│           └── index.ts
├── middleware.ts                    # Route-skydd baserat på roll
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Steg 1 — Sätt upp projektet

Kör dessa kommandon i terminalen:

```bash
npx create-next-app@latest maklarforum \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd maklarforum

npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  react-hook-form \
  @hookform/resolvers \
  zod \
  resend \
  date-fns \
  slugify \
  lucide-react \
  clsx \
  tailwind-merge

npm install -D \
  supabase
```

---

## Steg 2 — Supabase Setup

1. Gå till supabase.com → skapa nytt projekt "maklarforum"
2. Gå till SQL Editor → kör hela innehållet i `supabase/schema.sql`
3. Gå till Authentication → Email → aktivera "Confirm email"
4. Kopiera Project URL och anon key till `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=din_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_anon_key
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key
RESEND_API_KEY=din_resend_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Steg 3 — Bygg i denna ordning

### Sprint 1 (Vecka 1-2): Auth & Grundstruktur
Bygg middleware, Supabase-klienter, auth-flöde (registrera/logga in), auto-profil-skapning, root layout med header/footer.

### Sprint 2 (Vecka 3-4): Frågor & Svar (MVP-kärnan)
Frågeformulär med GeoScopeSelector, frågelista med filtrering, enskild frågesida (SSR för SEO), svarsformulär för proffs, Edge Function för emailnotiser.

### Sprint 3 (Vecka 5-6): Mäklarprofiler
Signup-flöde för proffs, admin-dashboard för verifiering, publika profilsidor (SSR för SEO), mäklare konfigurerar sina bevakningsområden.

### Sprint 4 (Vecka 7-8): Meddelanden & Dashboard
Direktmeddelanden, proffs-dashboard med statistik, konsumentens "Mina frågor".

### Sprint 5 (Vecka 9-10): Internt Forum
Forum med kategorier, inlägg och svar, rekryteringsflöde, synligt ENDAST för verifierade proffs.

### Sprint 6 (Vecka 11-12): SEO, Content & Beta
Sitemap, structured data (FAQPage JSON-LD), guider för köpare/säljare, marknadsdata-sidor, mobiloptimering, betalaunch.

---

## Viktiga regler att följa i koden

1. **Använd alltid Server Components för publika sidor** — kritiskt för SEO
2. **generateMetadata() på varje publik sida** — unik title och description
3. **RLS hanterar säkerhet** — lita på databasens policies, verifiera inte manuellt i API-routes
4. **TypeScript strict mode** — inga `any`-typer
5. **Zod för all input-validering** — both client och server-side
6. **Svarsmodell:** En professional kan svara EN gång per fråga + EN followup-kommentar. Aldrig kommentera andras svar.

Se separata filer för detaljerade instruktioner per modul.
