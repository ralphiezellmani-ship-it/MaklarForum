import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AgentProfileForm } from "@/components/agent-profile-form";
import { MessageComposeForm } from "@/components/message-compose-form";
import { formatDate } from "@/lib/format";
import { getAgentLeadMetrics, getAgentProfile, getMessageThreads, getWatchedThreads } from "@/lib/data";
import { sendMessageAction } from "@/app/dashboard/maklare/actions";
import Link from "next/link";

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

  const [{ count: answerCount }, { count: profileViews }, { data: profile }, watchedThreads, messageThreads, agentProfile, leadMetrics] = await Promise.all([
    supabase.from("answers").select("id", { count: "exact", head: true }).eq("answered_by", user.id),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("verification_status, subscription_status, city, firm").eq("id", user.id).single(),
    getWatchedThreads(user.id),
    getMessageThreads(user.id),
    getAgentProfile(user.id),
    getAgentLeadMetrics(user.id),
  ]);
  const recipientsMap = new Map<string, { id: string; name: string }>();
  for (const thread of messageThreads) {
    recipientsMap.set(thread.otherUserId, { id: thread.otherUserId, name: thread.otherUserName });
  }
  const recipients = [...recipientsMap.values()];

  return (
    <div>
      <h1 className="text-4xl">Mäklardashboard</h1>
      <p className="mt-2 text-[var(--muted)]">Svar, profilprestanda, bevakade kommuner och notifikationsinställningar.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/maklare/profil" className="pill pill-dark">
          Gå till min profil
        </Link>
        <Link href="/dashboard/maklare/fragor" className="pill pill-light">
          Frågor att besvara
        </Link>
        <Link href="/dashboard/maklare/messages" className="pill pill-light">
          Meddelanden
        </Link>
      </div>

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
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="metric">
          <p className="text-2xl font-semibold">{leadMetrics.sentTotal}</p>
          <p className="text-xs text-[var(--muted)]">Automatiska tips/leads skickade totalt</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{leadMetrics.sentLast30Days}</p>
          <p className="text-xs text-[var(--muted)]">Skickade senaste 30 dagar</p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Meddelanden</h2>
            <Link href="/dashboard/maklare/messages" className="text-sm text-[var(--accent)]">
              Öppna inkorg
            </Link>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">Snabböversikt över senaste konversationer.</p>
          <div className="mt-4 space-y-3">
            {messageThreads.length === 0 ? <p className="text-sm text-[var(--muted)]">Inga meddelanden ännu.</p> : null}
            {messageThreads.map((thread) => (
              <Link
                key={thread.otherUserId}
                href={`/dashboard/maklare/messages/${thread.otherUserId}`}
                className="block rounded-xl border border-[var(--line)] bg-white p-3"
              >
                <p className="font-medium">{thread.otherUserName} ({thread.otherUserRole})</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{thread.lastMessage}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatDate(thread.lastMessageAt)} • Olästa: {thread.unreadCount}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <h3 className="mb-2 text-sm font-semibold">Skicka nytt meddelande</h3>
            {recipients.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">En kund behöver initiera dialog först innan du kan skriva här.</p>
            ) : (
              <MessageComposeForm recipients={recipients} action={sendMessageAction} />
            )}
          </div>
        </article>
      </section>

      <section className="mt-6 card">
        <h2 className="text-xl">Mäklargrupper</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Skapa eller gå med i lokala grupper för kunskapsutbyte, till exempel Mäklare i Täby eller andra nischgrupper.
        </p>
        <Link href="/dashboard/maklare/grupper" className="mt-4 inline-flex text-sm text-[var(--accent)]">
          Öppna grupper
        </Link>
      </section>
    </div>
  );
}
