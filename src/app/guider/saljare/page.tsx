import { GuideCard } from "@/components/guide-card";
import { sellerGuides } from "@/lib/mock-data";

export default function SellerGuidesPage() {
  return (
    <div>
      <h1 className="text-4xl">Guider för säljare</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">Startpaket med tydliga guider om värdering, styling, arvode och budstrategi.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sellerGuides.map((article) => (
          <GuideCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
