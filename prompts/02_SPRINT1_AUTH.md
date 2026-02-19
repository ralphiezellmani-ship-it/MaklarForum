# Sprint 1 — Auth & Grundstruktur

## Vad vi bygger i detta steg

Hela fundamentet: Supabase-integration, autentisering, rollbaserad middleware och grundlayout. Inget synligt för slutanvändaren ännu — men utan detta fungerar ingenting.

---

## Filer att skapa

### 1. `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2. `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### 3. `middleware.ts` (root-nivå)
Middleware ska:
- Refresha Supabase-session automatiskt
- Skydda `/dashboard`, `/profil`, `/svar`, `/meddelanden`, `/objekt`, `/forum` → kräver inloggning som `professional` med `verified` status
- Skydda `/mina-fragor` → kräver inloggning (consumer eller professional)
- Skydda `/admin/*` → kräver admin-behörighet
- Redirecta inloggade användare bort från `/logga-in` och `/registrera`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Skydda professional-routes
  const professionalRoutes = ['/dashboard', '/profil', '/svar', '/meddelanden', '/objekt', '/forum']
  if (professionalRoutes.some(r => path.startsWith(r))) {
    if (!user) {
      return NextResponse.redirect(new URL('/logga-in', request.url))
    }
    // Kolla verifierad professional-status
    const { data: profile } = await supabase
      .from('professional_profiles')
      .select('verification_status')
      .eq('profile_id', user.id)
      .single()
    
    if (!profile || profile.verification_status !== 'verified') {
      return NextResponse.redirect(new URL('/vantande-verifiering', request.url))
    }
  }

  // Skydda consumer-routes
  if (path.startsWith('/mina-fragor')) {
    if (!user) return NextResponse.redirect(new URL('/logga-in', request.url))
  }

  // Skydda admin-routes
  if (path.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/logga-in', request.url))
    // TODO: Lägg till admin-rollkontroll
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 4. `app/(auth)/registrera/page.tsx`
Registreringssida med två flöden:
- **Konsument:** Namn, email, lösenord. Direkt aktiv.
- **Proffs:** Namn, email, lösenord, FMI-nummer (agents), firma, titel, yrkesroll (dropdown: mäklare/bank/besiktning/hantverkare/kommun), bevakningskommuner (multi-select), accept av villkor. Status sätts till `pending` tills admin godkänner.

### 5. `app/(auth)/logga-in/page.tsx`
Email + lösenord. Redirect efter inloggning:
- Consumer → `/mina-fragor`
- Verified professional → `/dashboard`
- Pending professional → `/vantande-verifiering`

### 6. `app/(auth)/callback/route.ts`
Standard Supabase auth callback för email-verifiering.

### 7. `app/vantande-verifiering/page.tsx`
Enkel sida som visar: "Din ansökan granskas. Du aktiveras inom 48 timmar."

### 8. `app/layout.tsx`
Root layout med:
- Tailwind CSS
- Inter font (Google Fonts)
- `<Header />` och `<Footer />`
- Supabase auth provider

### 9. `components/layout/Header.tsx`
- Logo "Mäklarforum" (länk till /)
- Navigation: Frågor | Hitta mäklare | Guider | Marknadsdata
- Auth-state: Visa "Logga in / Registrera" ELLER användarens namn + dropdown med dashboard-länk + logga ut
- Mobilmeny (hamburger)

### 10. `components/layout/Footer.tsx`
- Logo + tagline
- Kolumner: För konsumenter | För mäklare | Om oss
- Copyright

---

## Supabase Edge Function: Auto-profil vid signup

Denna trigger finns redan i schema.sql (`handle_new_user`). Verifiera att den fungerar genom att registrera ett testkonto och kontrollera att en rad skapas i `profiles`-tabellen.

---

## TypeScript-typer

Generera Supabase-typer med:
```bash
npx supabase gen types typescript --project-id DIN_PROJECT_ID > lib/types/database.types.ts
```

Skapa sedan `lib/types/index.ts` med convenience-typer:
```typescript
import { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfessionalProfile = Database['public']['Tables']['professional_profiles']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type ForumPost = Database['public']['Tables']['forum_posts']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']

// Joined types som används ofta
export type QuestionWithProfile = Question & {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'>
}

export type AnswerWithProfessional = Answer & {
  professional_profiles: ProfessionalProfile & {
    profiles: Pick<Profile, 'full_name' | 'avatar_url'>
  }
}
```

---

## Definition of Done för Sprint 1

- [ ] `npm run dev` startar utan fel
- [ ] Registrering som konsument fungerar, profil skapas i Supabase
- [ ] Registrering som proffs fungerar, status är `pending`
- [ ] Inloggning fungerar, redirect till rätt sida baserat på roll
- [ ] Middleware blockerar `/dashboard` för oinloggade
- [ ] Header visar rätt state (inloggad/utloggad)
- [ ] TypeScript-typer genererade och importerade
