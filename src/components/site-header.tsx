import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/app/auth/actions";

const nav = [
  { href: "/fragor", label: "Frågor & svar" },
  { href: "/maklare", label: "Mäklare" },
  { href: "/forum", label: "Mäklarforum" },
  { href: "/guider/kopare", label: "Köparguider" },
  { href: "/guider/saljare", label: "Säljarguider" },
  { href: "/ordlista", label: "Ordlista" },
  { href: "/admin", label: "Admin" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-[rgba(243,241,236,0.92)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          Mäklarforum.se
        </Link>
        <nav className="hidden gap-4 text-sm md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-xs text-[var(--muted)] sm:inline">{user.fullName}</span>
              {user.role === "consumer" ? (
                <Link href="/dashboard/konsument" className="pill pill-light">
                  Min sida
                </Link>
              ) : null}
              {user.role === "agent" ? (
                <Link href="/dashboard/maklare" className="pill pill-light">
                  Mäklarpanel
                </Link>
              ) : null}
              {user.role === "admin" ? (
                <Link href="/admin" className="pill pill-light">
                  Admin
                </Link>
              ) : null}
              <form action={signOutAction}>
                <button className="pill pill-dark">Logga ut</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="pill pill-dark">
              Logga in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
