import Link from "next/link";
import { glossaryTerms } from "@/lib/mock-data";

export default function GlossaryPage() {
  return (
    <div>
      <h1 className="text-4xl">Ordlista</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">SEO-drivna begreppssidor för vanliga fastighetstermer.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {glossaryTerms.map((term) => (
          <article key={term.slug} className="card">
            <h2 className="text-xl font-semibold">
              <Link href={`/ordlista/${term.slug}`}>{term.term}</Link>
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{term.definition}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
