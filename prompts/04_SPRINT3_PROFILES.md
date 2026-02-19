# Sprint 3 — Mäklarprofiler & Adminverifiering

## Vad vi bygger

Publika profilsidor för varje verifierat proffs (SEO-indexerade), admin-dashboard för att godkänna ansökningar, och proffsets egna profileditor.

---

## Filer att skapa

### 1. `app/(public)/proffs/[slug]/page.tsx`
Server Component med SSR. Kritisk för SEO — varje mäklare får en Google-indexerad sida.

```typescript
export async function generateMetadata({ params }) {
  const pro = await getProfessional(params.slug)
  return {
    title: `${pro.profiles.full_name} — ${pro.firm_name} | Mäklarforum`,
    description: `${pro.profiles.full_name} är ${pro.title} på ${pro.firm_name} i ${pro.areas[0]?.municipality}. Se profil, svar och objekt.`,
  }
}

// JSON-LD: Person schema
// {
//   "@type": "Person",
//   "name": pro.profiles.full_name,
//   "jobTitle": pro.title,
//   "worksFor": { "@type": "Organization", "name": pro.firm_name }
// }

// Layout:
// - Profilhuvud: bild, namn, firma, titel, areas, verified-badge
// - Bio
// - Statistik: X svar, X hjälpsamma röster, X profilvisningar (månaden)
// - Aktiva objekt (ListingsGrid)
// - Senaste svar (AnswerCard × 5)
// - Kontakta-knapp → direktmeddelande
```

Logga profilvisning server-side:
```typescript
// Insert i profile_views (fire-and-forget, ingen await)
supabase.from('profile_views').insert({ professional_id: pro.id, viewed_by: userId })
```

### 2. `app/(public)/proffs/page.tsx`
Lista alla verifierade proffs med filtrering på:
- Yrkesroll (mäklare/bank/besiktning etc)
- Kommun
- Sökfält (namn eller firma)

```typescript
export const metadata = {
  title: 'Hitta fastighetsmäklare & bostadsexperter | Mäklarforum',
  description: 'Bläddra bland verifierade fastighetsmäklare, bolånerådgivare och bostadsexperter. Läs deras svar och kontakta direkt.'
}
```

### 3. `components/profiles/ProCard.tsx`
Kort-vy för proffslistning:
- Profilbild, namn, firma, titel
- Primärkommun
- Antal svar + helpful votes
- Verified-badge
- Länk till profilsida

### 4. `components/profiles/VerificationBadge.tsx`
Grön badge med bockmarkering: "Verifierad mäklare" / "Verifierad bolånerådgivare" etc. Baserat på `professional_type`.

### 5. `app/(professional)/profil/page.tsx`
Proffsets egna profilsida att redigera.

Sektioner:
- **Grundinfo:** Foto (upload till Supabase Storage), bio, telefon, webbsida
- **Bevakningsområden:** Lägg till/ta bort kommuner (multi-select med sök)
- **Notifikationsinställningar:** Direkt email vs daglig digest, per kategori
- **Mina objekt:** Lägg till/ta bort listings (se Sprint 4)

### 6. `app/(admin)/admin/verifieringar/page.tsx`
Admin-dashboard för att hantera nya ansökningar.

```typescript
// Hämta alla professional_profiles med status = 'pending'
// Per ansökan visa:
// - Namn, email, firma, titel, FMI-nummer, bevakningskommuner
// - Länk till FMI-registret för manuell kontroll
// - Godkänn-knapp → sätter status till 'verified', skickar välkomstmail
// - Neka-knapp → sätter status till 'rejected', skickar email med orsak
// - Kommentarsfält för admin-anteckning (loggas i audit_log)
```

### 7. `app/api/admin/verify/route.ts`
```typescript
// POST /api/admin/verify
// Body: { professional_id, action: 'approve' | 'reject', note?: string }
// 1. Kräver admin-behörighet
// 2. Uppdatera verification_status
// 3. Sätt verified_at och verified_by
// 4. Skapa rad i audit_log
// 5. Skicka email via Resend
// 6. Om approve: skapa notification för proffset
```

### 8. Email-mallar i Resend

**Välkomstmail (approved):**
```
Ämne: Välkommen till Mäklarforum! Din profil är nu aktiv.

Hej [Namn],

Din profil på Mäklarforum är nu verifierad och aktiv. Du kan nu:
- Svara på frågor från konsumenter i [Kommuner]
- Visa dina aktiva objekt på din profilsida
- Delta i det interna mäklarforumet

Din profilsida: maklarforum.se/proffs/[slug]

Logga in och börja svara på frågor →
```

**Nekat mail (rejected):**
```
Ämne: Din ansökan till Mäklarforum

Hej [Namn],

Vi kunde tyvärr inte verifiera din profil. [Orsak]

Om du anser att detta är ett misstag, kontakta oss på hej@maklarforum.se
```

### 9. `lib/validations/professional.schema.ts`
```typescript
import { z } from 'zod'

export const professionalSignupSchema = z.object({
  full_name: z.string().min(2, 'Ange ditt fullständiga namn'),
  email: z.string().email('Ange en giltig email'),
  password: z.string().min(8, 'Lösenordet måste vara minst 8 tecken'),
  professional_type: z.enum(['agent', 'bank', 'inspector', 'contractor', 'municipality', 'other']),
  firm_name: z.string().min(2, 'Ange din firma'),
  title: z.string().min(2, 'Ange din titel'),
  fmi_number: z.string().optional(), // Obligatorisk om professional_type === 'agent'
  bio: z.string().max(500, 'Max 500 tecken').optional(),
  areas: z.array(z.string()).min(1, 'Välj minst ett bevakningsområde'),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'Du måste acceptera villkoren för att fortsätta'
  }),
}).refine(data => {
  if (data.professional_type === 'agent' && !data.fmi_number) {
    return false
  }
  return true
}, {
  message: 'FMI-nummer krävs för fastighetsmäklare',
  path: ['fmi_number']
})
```

---

## Definition of Done för Sprint 3

- [ ] `/proffs/[slug]` renderas server-side med korrekt metadata och JSON-LD
- [ ] Profilvisningar loggas och visas i proffsets statistik
- [ ] `/proffs` listar alla verifierade proffs med filtrering
- [ ] Admin kan godkänna/neka ansökningar i dashboarden
- [ ] Välkomstmail skickas automatiskt vid godkännande
- [ ] Proffs kan redigera sin profil och bevakningsområden
- [ ] Slug genereras automatiskt från namn + stad
