# Sprint 4–6 — Meddelanden, Forum, SEO & Content

---

# Sprint 4 — Meddelanden & Dashboard

## Direktmeddelanden

### `app/(professional)/meddelanden/page.tsx`
Dashboard för meddelanden. Visar:
- Alla konversationstrådar med senaste meddelande
- Oläst-indikator (röd dot)
- Klick öppnar konversationen

### `app/(consumer)/meddelanden/page.tsx`
Samma layout men för konsumenter. Konsumenter kan BARA starta konversationer via "Kontakta"-knappen på en profilsida — inte söka upp proffs manuellt.

### `components/messages/MessageThread.tsx`
Chat-liknande vy med meddelandebubbla per meddelande.
- Skicka-knapp markerar automatiskt mottagna som lästa
- Realtidsuppdateringar via Supabase Realtime

```typescript
// Supabase Realtime subscription
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, handleNewMessage)
  .subscribe()
```

---

## Proffs-dashboard

### `app/(professional)/dashboard/page.tsx`
Huvuddashboard för verifierat proffs. Visar:

**Statistikkort (denna månaden):**
- X profilvisningar
- X frågor att svara på (i dina bevakningsområden, ännu ej besvarade)
- X svar du gett
- X helpful votes

**Åtgärdslista:**
- Nya obesvarade frågor i dina bevakningsområden (sorterat senast)
- Olästa meddelanden

**Snabblänkar:**
- "Svara på frågor" → `/svar`
- "Redigera profil" → `/profil`
- "Mina objekt" → `/objekt`
- "Gå till forumet" → `/forum`

### `app/(professional)/svar/page.tsx`
Lista alla öppna frågor som matchar proffsets bevakningsområden, sorterade senast publicerade. Visar om proffset redan svarat. Filter på kategori.

### `app/(professional)/objekt/page.tsx`
Hantera listings. Lägg till nytt objekt (titel, adress, kommun, pris, storlek, rum, bild-URL, Hemnet-länk), markera som sålt, ta bort.

---

## Consumer dashboard

### `app/(consumer)/mina-fragor/page.tsx`
Konsumentens historik:
- Alla ställda frågor med status (öppen/besvarad)
- Antal svar per fråga
- Länk till frågan
- "Ställ en ny fråga"-knapp

---

# Sprint 5 — Internt Mäklarforum

## Åtkomstkontroll

Det interna forumet är ALDRIG synligt för konsumenter. Middleware och RLS säkerställer detta på två nivåer.

### `app/(professional)/forum/page.tsx`
Forumets startsida. Visar:
- Kategorier med antal inlägg och senaste aktivitet
- Pinnade inlägg
- Rekryteringsannonser (separat sektion)
- "Nytt inlägg"-knapp

Kategorier: Juridik & Kontrakt | Budgivning & Prissättning | Teknik & Verktyg | Rekrytering & Karriär | Allmänt

### `app/(professional)/forum/[slug]/page.tsx`
Enskilt forumsinlägg med alla svar.
- Inläggstitel, brödtext, kategori, författare, datum
- Svar i tidsordning
- Svarsformulär längst ner
- Inläggsförfattaren kan redigera sitt inlägg

### `app/(professional)/forum/nytt/page.tsx`
Skapa nytt inlägg. Fält: Titel, kategori, brödtext (markdown-editor), är detta en rekryteringsannons?

### Rekryteringsflöde
Om `is_recruitment = true` visas inlägget i en separat "Lediga tjänster"-sektion. Proffs kan markera sig som "öppen för nya möjligheter" i sin profil — synligt BARA för inläggsskaparen (firma), ALDRIG publikt.

---

# Sprint 6 — SEO-content & Betalaunch

## Innehållssidor

### `app/(public)/guider/salja/page.tsx`
Guide för säljare. Statisk content (kan uppdateras i `content_pages`-tabellen).

Sektioner:
- Checklista inför försäljning
- Hur väljer jag rätt mäklare?
- Vad ingår i mäklararvodet?
- Hur fungerar budgivning?
- Styling-tips inför visning
- Vanliga misstag att undvika

### `app/(public)/guider/kopa/page.tsx`
Guide för köpare.

Sektioner:
- Hur mycket kan jag låna?
- Amorteringskrav och kontantinsats
- Vad ska jag tänka på vid visning?
- Budgivningsstrategi för köpare
- Vad kostar en besiktning och vad täcker den?
- Dolda fel och säljarens ansvar
- Tillträdesprocessen steg för steg

### `app/(public)/guider/ordlista/page.tsx`
Ordlista med fastighetstermer. SEO-guld — rankar på sökningar som "vad betyder pantbrev" etc.

50+ termer: Pantbrev, Lagfart, Kontantinsats, Handpenning, Budgivning, Besiktning, Dolda fel, Boendekostnad, Driftskostnad, Förening, Årsredovisning, Tomträtt, Arrende, Servitut...

### `app/(public)/marknadsdata/[municipality]/page.tsx`
Lokal marknadsdata per kommun.

```typescript
export async function generateMetadata({ params }) {
  return {
    title: `Bostadsmarknaden i ${params.municipality} | Mäklarforum`,
    description: `Aktuell statistik om bostadsmarknaden i ${params.municipality}. Snittpris per kvm, försäljningstid och prisutveckling.`
  }
}
```

Visar data från `market_data`-tabellen:
- Snittpris per kvm (senaste 12 månader)
- Genomsnittlig tid på marknaden
- Antal sålda objekt per månad
- Prisutveckling i procent
- Aktiva mäklare i kommunen (länk till deras profiler)
- Senaste frågor från kommunen

### `app/(public)/omraden/[municipality]/page.tsx`
Samlingssida per kommun: alla frågor + verifierade proffs i den kommunen.

```typescript
export const metadata = {
  title: `Fastighetsmäklare och bostadsfrågor i ${municipality} | Mäklarforum`,
  ...
}
```

### `app/(public)/kategorier/[category]/page.tsx`
Samlingssida per frågekategori. Alla frågor + besvarade frågor i kategorin.

---

## robots.ts
```typescript
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/profil', '/svar', '/meddelanden', '/objekt', '/forum', '/admin', '/mina-fragor'],
    },
    sitemap: 'https://maklarforum.se/sitemap.xml',
  }
}
```

---

## Betalaunch-checklista

### Tekniskt
- [ ] Vercel-projekt kopplat till GitHub
- [ ] Environment variables satta i Vercel
- [ ] Custom domain maklarforum.se konfigurerad
- [ ] Supabase production-projekt (inte development)
- [ ] Resend domain-verifiering klar (hej@maklarforum.se)
- [ ] Google Search Console: lägg till och verifiera domänen
- [ ] Google Analytics 4 installerat
- [ ] Sitemap skickad till Google

### Innehåll
- [ ] 20+ testfrågor skapade (realistiska, olika kategorier)
- [ ] 5-10 verifierade betamäklare aktiva
- [ ] Guider för köpare och säljare publicerade
- [ ] Ordlista publicerad
- [ ] Marknadsdata för de 10 största städerna inlagd

### Juridiskt
- [ ] Integritetspolicy publicerad
- [ ] Användarvillkor publicerade
- [ ] Mäklarvillkor (med nolltolerans-klausulen) publicerade
- [ ] Cookie-banner (GDPR)
- [ ] Disclaimer på alla frågesidor ("Svar utgör inte juridisk rådgivning")
