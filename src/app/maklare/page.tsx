import { AgentCard } from "@/components/agent-card";
import { getAgents } from "@/lib/data";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div>
      <h1 className="text-4xl">Verifierade mäklare</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">
        Alla profiler är kopplade till FMI-nummer och verifieras av admin innan de får svara eller medverka i mäklarforumet.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
