import Link from "next/link";
import { AgentProfile } from "@/lib/types";

export function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <article className="card">
      <div className="mb-3 flex items-center justify-between">
        <span className="pill pill-light">Verifierad FMI</span>
        {agent.premium ? <span className="pill pill-gold">Premium</span> : null}
      </div>
      <h3 className="text-lg font-semibold">
        <Link href={`/maklare/${agent.slug}`}>{agent.fullName}</Link>
      </h3>
      <p className="text-sm text-[var(--muted)]">
        {agent.title} | {agent.firm}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">{agent.bio}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="font-semibold text-[var(--ink)]">{agent.soldCount}</p>
          <p className="text-[var(--muted)]">Sålda</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--ink)]">{agent.activeCount}</p>
          <p className="text-[var(--muted)]">Aktiva</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--ink)]">{agent.profileViews}</p>
          <p className="text-[var(--muted)]">Profilvisn.</p>
        </div>
      </div>
    </article>
  );
}
