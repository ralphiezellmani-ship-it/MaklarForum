import { notFound } from "next/navigation";
import { buyerGuides } from "@/lib/mock-data";

export function generateStaticParams() {
  return buyerGuides.map((guide) => ({ slug: guide.slug }));
}

export default async function BuyerGuideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = buyerGuides.find((item) => item.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="card max-w-4xl">
      <p className="text-xs text-[var(--muted)]">{article.minutes} min läsning</p>
      <h1 className="mt-2 text-4xl">{article.title}</h1>
      <p className="mt-3 text-[var(--muted)]">{article.excerpt}</p>
      <div className="mt-6 space-y-3 text-sm leading-6 text-[var(--ink)]">
        {article.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
