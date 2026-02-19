import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { LoginPortalSwitcher } from "@/components/login-portal-switcher";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-3xl">Logga in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Standard är konsumentinloggning. Byt till mäklarläge i listan nedan.</p>
        <div className="mt-4">
          <LoginPortalSwitcher portal="consumer" next={next ?? "/"} />
        </div>
        <LoginForm next={next ?? "/"} portal="consumer" />
        <div className="mt-4 text-sm text-[var(--muted)]">
          <p>
            Ny konsument? <Link href="/register/consumer" className="text-[var(--accent)]">Skapa konto</Link>
          </p>
          <p>
            Ny mäklare? <Link href="/register/maklare" className="text-[var(--accent)]">Registrera mäklarprofil</Link> eller <Link href={`/login/maklare?next=${encodeURIComponent(next ?? "/")}`} className="text-[var(--accent)]">gå till mäklarinloggning</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
