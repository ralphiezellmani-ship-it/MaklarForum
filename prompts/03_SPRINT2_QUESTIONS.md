# Sprint 2 — Frågor & Svar (SEO-kärnan)

## Vad vi bygger

Q&A-flödet är hela produktens kärna och trafik-motor. Varje fråga + svar blir en indexerbar Google-sida. Det är detta som driver organisk trafik och gör att mäklarkontor vill betala för leads.

---

## Kritiskt: Server-Side Rendering för SEO

Alla publika frågesidor MÅSTE renderas server-side. Använd aldrig `'use client'` på själva sidskomponenten för `/fragor/[slug]`. Hämta data i Server Component, skicka ner till Client Components för interaktivitet.

---

## Filer att skapa

### 1. `lib/utils/municipalities.ts`
Exportera en array med alla 290 svenska kommuner. Används i GeoScopeSelector.

```typescript
export const SWEDISH_MUNICIPALITIES = [
  'Ale', 'Alingsås', 'Alvesta', 'Aneby', 'Arboga',
  // ... alla 290 kommuner
  'Österåker', 'Östersund', 'Östra Göinge', 'Österbymo', 'Övertorneå'
]

export const SWEDISH_REGIONS = [
  'Blekinge', 'Dalarna', 'Gotland', 'Gävleborg', 'Halland',
  'Jämtland', 'Jönköping', 'Kalmar', 'Kronoberg', 'Norrbotten',
  'Skåne', 'Stockholm', 'Södermanland', 'Uppsala', 'Värmland',
  'Västerbotten', 'Västernorrland', 'Västmanland', 'Västra Götaland',
  'Örebro', 'Östergötland'
]
```

### 2. `lib/utils/categories.ts`
```typescript
export const QUESTION_CATEGORIES = {
  buying: { label: 'Köpa bostad', icon: '🏠', description: 'Frågor om att köpa bostad' },
  selling: { label: 'Sälja bostad', icon: '📋', description: 'Frågor om att sälja bostad' },
  legal: { label: 'Juridik', icon: '⚖️', description: 'Kontrakt, avtal och juridiska frågor' },
  valuation: { label: 'Värdering', icon: '💰', description: 'Vad är min bostad värd?' },
  financing: { label: 'Bolån & Finansiering', icon: '🏦', description: 'Bolån, räntor och finansiering' },
  renovation: { label: 'Renovering & Besiktning', icon: '🔨', description: 'Besiktning, ROT och renovering' },
  moving: { label: 'Flytt & Praktiskt', icon: '📦', description: 'Praktiska frågor kring flytt' },
  market: { label: 'Marknad & Trender', icon: '📈', description: 'Bostadsmarknadens utveckling' },
  other: { label: 'Övrigt', icon: '💬', description: 'Andra frågor' },
} as const
```

### 3. `lib/validations/question.schema.ts`
```typescript
import { z } from 'zod'

export const questionSchema = z.object({
  title: z.string()
    .min(10, 'Frågan måste vara minst 10 tecken')
    .max(200, 'Frågan får vara max 200 tecken'),
  body: z.string()
    .min(20, 'Beskriv din fråga med minst 20 tecken')
    .max(2000, 'Max 2000 tecken'),
  category: z.enum(['buying','selling','legal','valuation','financing','renovation','moving','market','other']),
  geo_scope: z.enum(['local', 'regional', 'national']),
  municipality: z.string().optional(),
  region: z.string().optional(),
}).refine(data => {
  if (data.geo_scope === 'local' && !data.municipality) return false
  if (data.geo_scope === 'regional' && !data.region) return false
  return true
}, { message: 'Välj ett geografiskt område' })

export type QuestionFormData = z.infer<typeof questionSchema>
```

### 4. `lib/validations/answer.schema.ts`
```typescript
import { z } from 'zod'

export const answerSchema = z.object({
  body: z.string()
    .min(50, 'Svaret måste vara minst 50 tecken')
    .max(3000, 'Max 3000 tecken'),
})

export const followupSchema = z.object({
  followup_comment: z.string()
    .min(10, 'Kommentaren måste vara minst 10 tecken')
    .max(1000, 'Max 1000 tecken'),
})
```

### 5. `components/questions/GeoScopeSelector.tsx`
Client Component. Visar tre alternativ:
- **Lokal** → dropdown med alla svenska kommuner
- **Regional** → dropdown med alla svenska län
- **Öppen för alla** → ingen dropdown

Använd `react-hook-form` Controller.

### 6. `components/questions/QuestionForm.tsx`
Client Component med `react-hook-form` + Zod.
Fält: Titel, Beskrivning (textarea), Kategori (select), GeoScopeSelector.
Submit → POST till `/api/questions`.
Visar success-state med länk till frågan.

### 7. `app/(public)/fragor/ny/page.tsx`
Server Component. Kräver inloggning (redirectar till `/logga-in` om ej inloggad). Renderar `<QuestionForm />`.

```typescript
// Metadata
export const metadata = {
  title: 'Ställ en fråga | Mäklarforum',
  description: 'Få svar direkt från verifierade fastighetsmäklare och andra bostadsexperter.'
}
```

### 8. `api/questions/route.ts`
```typescript
// POST /api/questions
// 1. Validera input med questionSchema
// 2. Hämta inloggad användare
// 3. Spara i questions-tabellen
// 4. Trigga Edge Function 'notify-professionals' (via Supabase)
// 5. Returnera { slug } för redirect
```

### 9. `app/(public)/fragor/page.tsx`
Server Component. Visar alla frågor med filtrering på kategori och geo.

```typescript
export const metadata = {
  title: 'Frågor om bostadsmarknaden | Mäklarforum',
  description: 'Ställ frågor om köp, försäljning och allt kring bostäder. Få svar av verifierade fastighetsmäklare.'
}

// Hämta frågor server-side
// Stöd för query params: ?kategori=buying&kommun=Göteborg
// Visa QuestionCard per fråga
// Paginering
```

### 10. `components/questions/QuestionCard.tsx`
Visar: Titel, kategori-badge, geografisk tag, antal svar, tid sedan publicering, länk till frågesidan.

### 11. `app/(public)/fragor/[slug]/page.tsx` ← VIKTIGASTE FILEN
Server Component med SSR. Kritisk för SEO.

```typescript
// generateMetadata — dynamisk title och description per fråga
export async function generateMetadata({ params }) {
  const question = await getQuestion(params.slug)
  return {
    title: `${question.title} | Mäklarforum`,
    description: `${question.body.slice(0, 155)}...`,
    openGraph: {
      title: question.title,
      description: question.body.slice(0, 155),
    }
  }
}

// generateStaticParams — pre-renderar de 100 senaste frågorna
export async function generateStaticParams() {
  // Hämta de 100 senaste frågorna och returnera deras slugs
}

// JSON-LD structured data (FAQPage schema)
// <JsonLd type="FAQPage" question={question} answers={answers} />

// Layout:
// - Frågan (titel + body + kategori + geo + datum)
// - "Följa fråga"-knapp
// - Lista med svar (AnswerCard per svar)
// - Om inloggad verified professional och INTE redan svarat: visa AnswerForm
// - Dela-knappar (Facebook, LinkedIn, kopiera länk)
```

### 12. `components/answers/AnswerCard.tsx`
Visar:
- Mäklarens profilbild, namn, firma, titel
- Verifierad-badge
- Svarets text
- Hjälpsamt-knapp (rösta)
- Followup-kommentar (om finns)
- "Kontakta denna mäklare"-knapp → öppnar meddelandeformulär

### 13. `components/answers/AnswerForm.tsx`
Client Component. Visas BARA om:
- Användaren är inloggad
- Användaren är verifierat proffs
- Användaren INTE redan svarat på denna fråga

Submit → POST till `/api/answers`.

### 14. `components/seo/JsonLd.tsx`
```typescript
// Genererar FAQPage JSON-LD för Google
// <script type="application/ld+json">
// {
//   "@context": "https://schema.org",
//   "@type": "FAQPage",
//   "mainEntity": [{
//     "@type": "Question",
//     "name": question.title,
//     "acceptedAnswer": {
//       "@type": "Answer",
//       "text": answers[0]?.body
//     }
//   }]
// }
// </script>
```

---

## Supabase Edge Function: notify-professionals

Skapa `supabase/edge-functions/notify-professionals/index.ts`:

```typescript
// Triggas när ny fråga skapas
// 1. Hämta frågans geo_scope och municipality/region
// 2. Hitta alla verifierade proffs som bevakar det området
// 3. Hämta deras email-adresser
// 4. Skicka email via Resend med:
//    - Subject: "Ny fråga i [Kommun]: [Frågetitel]"
//    - Body: Frågetext + direktlänk till svara
// 5. Skapa notification-rader i notifications-tabellen
```

---

## app/sitemap.ts
```typescript
export default async function sitemap() {
  const supabase = createClient()
  
  const { data: questions } = await supabase
    .from('questions')
    .select('slug, updated_at')
    .eq('status', 'answered')
    .order('created_at', { ascending: false })
    .limit(1000)

  const { data: professionals } = await supabase
    .from('professional_profiles')
    .select('profile_slug, updated_at')
    .eq('verification_status', 'verified')

  return [
    { url: 'https://maklarforum.se', lastModified: new Date() },
    { url: 'https://maklarforum.se/fragor', lastModified: new Date() },
    ...(questions?.map(q => ({
      url: `https://maklarforum.se/fragor/${q.slug}`,
      lastModified: new Date(q.updated_at),
    })) ?? []),
    ...(professionals?.map(p => ({
      url: `https://maklarforum.se/proffs/${p.profile_slug}`,
      lastModified: new Date(p.updated_at),
    })) ?? []),
  ]
}
```

---

## Definition of Done för Sprint 2

- [ ] Konsument kan ställa en fråga med geo-val
- [ ] Frågan sparas i Supabase och slug genereras automatiskt
- [ ] Email skickas till matchade mäklare via Resend
- [ ] `/fragor` listar alla frågor med filtrering
- [ ] `/fragor/[slug]` renderas server-side med korrekt metadata
- [ ] Verifierat proffs kan svara (max 1 gång)
- [ ] Proffs kan lägga till 1 followup-kommentar
- [ ] helpful_votes fungerar
- [ ] JSON-LD structured data finns på frågesidor
- [ ] Sitemap genereras med alla frågor
