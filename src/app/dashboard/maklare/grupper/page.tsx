import { requireRole } from "@/lib/auth";
import { getAgentGroupsForUser } from "@/lib/data";
import { AgentGroupCreateForm } from "@/components/agent-group-create-form";
import { joinAgentGroupAction, leaveAgentGroupAction } from "@/app/dashboard/maklare/actions";

const statusLabel: Record<string, string> = {
  pending: "Väntar på godkännande",
  approved: "Godkänd",
  rejected: "Nekad",
};

export default async function AgentGroupsPage() {
  const user = await requireRole("agent", "/dashboard/maklare/grupper");
  const groups = await getAgentGroupsForUser(user.id);

  return (
    <div>
      <h1 className="text-4xl">Mäklargrupper</h1>
      <p className="mt-2 text-[var(--muted)]">
        Lokala och nischade grupper för samarbete. Nya grupper publiceras först efter admin-godkännande.
      </p>

      <section className="mt-6 card">
        <h2 className="text-xl">Skapa ny grupp</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Exempel: Mäklare i Täby, Gravida mäklare.</p>
        <div className="mt-4">
          <AgentGroupCreateForm />
        </div>
      </section>

      <section className="mt-6 card">
        <h2 className="text-xl">Tillgängliga grupper</h2>
        <div className="mt-4 space-y-3">
          {groups.length === 0 ? <p className="text-sm text-[var(--muted)]">Inga grupper hittades ännu.</p> : null}
          {groups.map((group) => (
            <article key={group.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{group.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {group.municipality || "-"} | {group.region || "-"}
                  </p>
                  {group.description ? <p className="mt-1 text-sm text-[var(--muted)]">{group.description}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)]">{statusLabel[group.status] ?? group.status}</p>
                  <p className="text-xs text-[var(--muted)]">Medlemmar: {group.memberCount}</p>
                </div>
              </div>

              {group.status === "approved" ? (
                <div className="mt-3">
                  {group.isMember ? (
                    <form action={leaveAgentGroupAction.bind(null, group.id)}>
                      <button className="pill pill-light">Lämna grupp</button>
                    </form>
                  ) : (
                    <form action={joinAgentGroupAction.bind(null, group.id)}>
                      <button className="pill pill-dark">Gå med</button>
                    </form>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
