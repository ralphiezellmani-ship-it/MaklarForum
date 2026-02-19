import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AgentProfileForm } from "@/components/agent-profile-form";
import { MessageComposeForm } from "@/components/message-compose-form";
import { formatDate } from "@/lib/format";
import { getAgentProfile, getMessageThreads, getPotentialMessageRecipientsFromWatched, getWatchedThreads } from "@/lib/data";

const verificationLabels: Record<string, string> = {
  pending: "Väntar",
  verified: "Verifierad",
  suspended: "Avstängd",
};

const planLabels: Record<string, string> = {
  none: "Ingen",
  trial: "Testperiod",
  active: "Aktiv",
  past_due: "Förfallen",
  canceled: "Avslutad",
};

export default async function AgentDashboardPage() {
  const user = await requireRole("agent", "/dashboard/maklare");
  const supabase = await createSupabaseServerClient();

  const [{ count: answerCount }, { count: profileViews }, { data: profile }, watchedThreads, messageThreads, watchedRecipients, agentProfile] = await Promise.all([
    supabase.from("answers").select("id", { count: "exact", head: true }).eq("answered_by", user.id),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("verification_status, subscription_status, city, firm").eq("id", user.id).single(),
    getWatchedThreads(user.id),
    getMessageThreads(user.id),
    getPotentialMessageRecipientsFromWatched(user.id),
    getAgentProfile(user.id),
  ]);
  const recipientsMap = new Map<string, { id: string; name: string }>();
  for (const thread of messageThreads) {
    recipientsMap.set(thread.otherUserId, { id: thread.otherUserId, name: thread.otherUserName });
  }
  for (const recipient of watchedRecipients) {
    recipientsMap.set(recipient.id, recipient);
  }
  const recipients = [...recipientsMap.values()];

  return (
    <div>
      <h1 className="text-4xl">Mäklardashboard</h1>
      <p className="mt-2 text-[var(--muted)]">Svar, profilprestanda, bevakade kommuner och notifikationsinställningar.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-2xl font-semibold">{answerCount ?? 0}</p>
          <p className="text-xs text-[var(--muted)]">Svar totalt</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{profileViews ?? 0}</p>
          <p className="text-xs text-[var(--muted)]">Aktiva frågor på plattformen</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{verificationLabels[profile?.verification_status ?? "pending"] ?? "Väntar"}</p>
          <p className="text-xs text-[var(--muted)]">Verifiering</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{planLabels[profile?.subscription_status ?? "none"] ?? "Ingen"}</p>
          <p className="text-xs text-[var(--muted)]">Planstatus</p>
        </div>
      </div>

      <section className="mt-6 card">
        <h2 className="text-xl">Profil</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{profile?.firm ?? "-"} | {profile?.city ?? "-"}</p>
        {agentProfile ? (
          <div className="mt-4">
            <AgentProfileForm
              defaults={{
                fullName: agentProfile.fullName,
                firm: agentProfile.firm,
                title: agentProfile.title,
                city: agentProfile.city,
                bio: agentProfile.bio,
              }}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl">Följda trådar</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Här ser du frågor du följer för att snabbt kunna svara och återkoppla.</p>
          <div className="mt-4 space-y-3">
            {watchedThreads.length === 0 ? <p className="text-sm text-[var(--muted)]">Du följer inga trådar ännu.</p> : null}
            {watchedThreads.map((thread) => (
              <a key={thread.questionId} href={`/fragor/${thread.questionSlug}`} className="block rounded-xl border border-[var(--line)] bg-white p-3">
                <p className="font-medium">{thread.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{thread.answerCount} svar • {formatDate(thread.createdAt)}</p>
              </a>
            ))}
          </div>
        </article>

        <article className="card">
          <h2 className="text-xl">Meddelanden</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Snabböversikt över senaste konversationer.</p>
          <div className="mt-4 space-y-3">
            {messageThreads.length === 0 ? <p className="text-sm text-[var(--muted)]">Inga meddelanden ännu.</p> : null}
            {messageThreads.map((thread) => (
              <div key={thread.otherUserId} className="rounded-xl border border-[var(--line)] bg-white p-3">
                <p className="font-medium">{thread.otherUserName} ({thread.otherUserRole})</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{thread.lastMessage}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatDate(thread.lastMessageAt)} • Olästa: {thread.unreadCount}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <h3 className="mb-2 text-sm font-semibold">Skicka nytt meddelande</h3>
            <MessageComposeForm recipients={recipients} />
          </div>
        </article>
      </section>
    </div>
  );
}
