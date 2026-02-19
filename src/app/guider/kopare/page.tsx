import { GuideCard } from "@/components/guide-card";
import { buyerGuides } from "@/lib/mock-data";

export default function BuyerGuidesPage() {
  return (
    <div>
      <h1 className="text-4xl">Guider för köpare</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">SEO-optimerade guider för hela köpresan: finansiering, juridik, budgivning och tillträde.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {buyerGuides.map((article) => (
          <GuideCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
