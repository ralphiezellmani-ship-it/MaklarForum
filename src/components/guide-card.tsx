import Link from "next/link";
import { GuideArticle } from "@/lib/types";

export function GuideCard({ article }: { article: GuideArticle }) {
  return (
    <article className="card">
      <p className="text-xs text-[var(--muted)]">{article.minutes} min läsning</p>
      <h3 className="mt-1 text-lg font-semibold">
        <Link href={`/guider/${article.section}/${article.slug}`}>{article.title}</Link>
      </h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{article.excerpt}</p>
    </article>
  );
}
