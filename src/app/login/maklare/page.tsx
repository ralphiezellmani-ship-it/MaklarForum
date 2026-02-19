import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { LoginPortalSwitcher } from "@/components/login-portal-switcher";

export default async function AgentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-3xl">Mäklarinloggning</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Logga in med din mäklaranvändare för att komma till mäklarpanelen.</p>
        <div className="mt-4">
          <LoginPortalSwitcher portal="agent" next={next ?? "/dashboard/maklare/profil"} />
        </div>
        <LoginForm next={next ?? "/dashboard/maklare/profil"} portal="agent" />
        <div className="mt-4 text-sm text-[var(--muted)]">
          <p>
            Ny mäklare? <Link href="/register/maklare" className="text-[var(--accent)]">Registrera mäklarprofil</Link>
          </p>
          <p>
            Konsument? <Link href={`/login?next=${encodeURIComponent(next ?? "/")}`} className="text-[var(--accent)]">Gå till kundinloggning</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
