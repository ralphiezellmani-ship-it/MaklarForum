import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AgentTipForm } from "@/components/agent-tip-form";
import { getAgentDashboardQuestionFeed, getAgentTipsByAuthor } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function AgentQuestionsPage() {
  const user = await requireRole("agent", "/dashboard/maklare/fragor");
  const [questions, myTips] = await Promise.all([getAgentDashboardQuestionFeed(user.id), getAgentTipsByAuthor(user.id)]);

  const unansweredFirst = [...questions].sort((a, b) => Number(a.answeredByMe) - Number(b.answeredByMe));

  return (
    <div>
      <h1 className="text-4xl">Frågor för dig</h1>
      <p className="mt-2 text-[var(--muted)]">Frågor i dina områden samt öppna frågor i hela Sverige.</p>

      <section className="mt-6 card">
        <h2 className="text-xl">Publicera tips för köpare och säljare</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Tips får tumme upp/ner från konsumenter och högre ranking ger bättre synlighet.</p>
        <div className="mt-4">
          <AgentTipForm />
        </div>
      </section>

      <section className="mt-6 card space-y-3">
        {unansweredFirst.length === 0 ? <p className="text-sm text-[var(--muted)]">Inga frågor hittades ännu.</p> : null}
        {unansweredFirst.map((question) => (
          <Link key={question.id} href={`/fragor/${question.slug}`} className="block rounded-xl border border-[var(--line)] bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{question.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {question.category} • {question.geoScope}
                  {question.municipality ? ` • ${question.municipality}` : ""}
                  {question.region ? `, ${question.region}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <p>{formatDate(question.createdAt)}</p>
                <p>{question.answeredByMe ? "Besvarad av dig" : "Väntar på ditt svar"}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-6 card">
        <h2 className="text-xl">Mina publicerade tips</h2>
        <div className="mt-4 space-y-3">
          {myTips.length === 0 ? <p className="text-sm text-[var(--muted)]">Du har inte publicerat tips ännu.</p> : null}
          {myTips.map((tip) => (
            <article key={tip.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <p className="font-medium">{tip.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Score: {tip.score} • Upp: {tip.upVotes} • Ner: {tip.downVotes}
              </p>
              <p className="mt-2 text-sm">{tip.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
