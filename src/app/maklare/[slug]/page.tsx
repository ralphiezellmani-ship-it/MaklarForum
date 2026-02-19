import { notFound } from "next/navigation";
import { getAgentBySlug, getAnswersByAgent, getAgentTipsByAuthor } from "@/lib/data";

export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const [agentAnswers, agentTips] = await Promise.all([getAnswersByAgent(agent.id), getAgentTipsByAuthor(agent.id)]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="card">
        <span className="pill pill-light">Verifierad mäklare</span>
        <h1 className="mt-3 text-3xl">{agent.fullName}</h1>
        <p className="text-sm text-[var(--muted)]">
          {agent.title} | {agent.firm}
        </p>
        <p className="mt-4 text-[var(--muted)]">{agent.bio}</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="metric">
            <p className="text-xl font-semibold">{agent.profileViews}</p>
            <p className="text-xs text-[var(--muted)]">Visningar</p>
          </div>
          <div className="metric">
            <p className="text-xl font-semibold">{agent.soldCount}</p>
            <p className="text-xs text-[var(--muted)]">Sålda</p>
          </div>
          <div className="metric">
            <p className="text-xl font-semibold">{agent.activeCount}</p>
            <p className="text-xs text-[var(--muted)]">Aktiva</p>
          </div>
        </div>
        <div className="mt-5 text-sm text-[var(--muted)]">
          <p>FMI-nummer: {agent.fmiNumber}</p>
          <p>Bevakar: {agent.municipalities.length > 0 ? agent.municipalities.join(", ") : "-"}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Senaste svar</h2>
        {agentAnswers.map((answer) => (
          <article key={answer.id} className="card">
            <p className="text-xs text-[var(--muted)]">På frågan: {answer.question?.title ?? "-"}</p>
            <p className="mt-2 text-sm">{answer.body}</p>
            <div className="mt-3 text-xs text-[var(--muted)]">{answer.helpfulVotes} hjälpsamt-röster</div>
          </article>
        ))}

        <h2 className="pt-2 text-2xl">Tips från mäklaren</h2>
        {agentTips.map((tip) => (
          <article key={tip.id} className="card">
            <p className="text-xs text-[var(--muted)]">
              {tip.audience} • {tip.geoScope}
              {tip.municipality ? ` • ${tip.municipality}` : ""}
              {tip.region ? `, ${tip.region}` : ""}
            </p>
            <p className="mt-2 text-sm font-medium">{tip.title}</p>
            <p className="mt-2 text-sm">{tip.body}</p>
            <div className="mt-3 text-xs text-[var(--muted)]">Score {tip.score} ({tip.upVotes} upp / {tip.downVotes} ner)</div>
          </article>
        ))}
      </section>
    </div>
  );
}
