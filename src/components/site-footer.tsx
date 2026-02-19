import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-white/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <h3 className="mb-2 font-semibold">Mäklarforum.se</h3>
          <p className="text-[var(--muted)]">Q&A-plattformen där konsumenter får svar av verifierade fastighetsmäklare.</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Juridik</h3>
          <div className="flex flex-col gap-1">
            <Link href="/villkor">Användarvillkor</Link>
            <Link href="/integritet">Integritetspolicy</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Affär</h3>
          <div className="flex flex-col gap-1">
            <Link href="/priser">Priser</Link>
            <span className="text-[var(--muted)]">Support-SLA: 48 h vardagar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
