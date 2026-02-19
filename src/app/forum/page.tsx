import { requireUser } from "@/lib/auth";
import Link from "next/link";

const posts = [
  {
    category: "juridik",
    title: "Nya tolkningar kring undersökningsplikt i BRF",
    body: "Hur hanterar ni informationsgivning i objektbeskrivning för att minska tvister?",
    replies: 14,
  },
  {
    category: "rekrytering",
    title: "Söker junior mäklare till västra Stockholm",
    body: "Team med hög leadvolym och stark intern coaching. Start omgående.",
    replies: 4,
  },
  {
    category: "teknik",
    title: "Vilket CRM syncar bäst med Hemnet och automatisk uppföljning?",
    body: "Vi jämför två system och vill minimera manuellt adminarbete.",
    replies: 9,
  },
];

export default async function ForumPage() {
  const user = await requireUser("/forum");

  if (user.role === "consumer") {
    return (
      <div className="card max-w-3xl">
        <h1 className="text-3xl">Endast för verifierade mäklare</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Mäklarforumet är stängt för konsumentkonton.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl">Internt mäklarforum</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">
        Endast verifierade mäklare har åtkomst. Fokus är kunskapsdelning, rekrytering och professionell utveckling.
      </p>
      <div className="mt-6 grid gap-4">
        {posts.map((post) => (
          <article key={post.title} className="card">
            <div className="mb-2 flex items-center justify-between">
              <span className="pill pill-light">{post.category}</span>
              <span className="text-xs text-[var(--muted)]">{post.replies} svar</span>
            </div>
            <h2 className="text-xl">{post.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{post.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 card">
        <h2 className="text-2xl">Mäklargrupper</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Skapa lokala och nischade grupper, till exempel Mäklare i Täby eller Gravida mäklare.
        </p>
        <Link href="/dashboard/maklare/grupper" className="mt-3 inline-block text-sm text-[var(--accent)]">
          Hantera grupper
        </Link>
      </div>
    </div>
  );
}
