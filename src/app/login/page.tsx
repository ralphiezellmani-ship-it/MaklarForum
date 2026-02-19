import Link from "next/link";
import { LoginForm } from "@/components/login-form";

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
        <p className="mt-2 text-sm text-[var(--muted)]">Använd din e-post och ditt lösenord.</p>
        <LoginForm next={next ?? "/"} />
        <div className="mt-4 text-sm text-[var(--muted)]">
          <p>
            Ny konsument? <Link href="/register/consumer" className="text-[var(--accent)]">Skapa konto</Link>
          </p>
          <p>
            Ny mäklare? <Link href="/register/maklare" className="text-[var(--accent)]">Registrera mäklarprofil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
