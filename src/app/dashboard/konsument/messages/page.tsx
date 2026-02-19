import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getMessageThreads, getVerifiedAgentRecipients } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { MessageComposeForm } from "@/components/message-compose-form";
import { sendConsumerMessageAction } from "@/app/dashboard/konsument/messages/actions";

export default async function ConsumerMessagesPage() {
  const user = await requireRole("consumer", "/dashboard/konsument/messages");
  const [threads, recipients] = await Promise.all([getMessageThreads(user.id), getVerifiedAgentRecipients()]);

  return (
    <div>
      <h1 className="text-4xl">Meddelanden</h1>
      <p className="mt-2 text-[var(--muted)]">Skriv direkt till verifierade mäklare och följ dina dialoger.</p>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl">Skicka nytt meddelande</h2>
          <div className="mt-4">
            <MessageComposeForm recipients={recipients} action={sendConsumerMessageAction} />
          </div>
        </article>

        <article className="card">
          <h2 className="text-xl">Inkorg</h2>
          <div className="mt-4 space-y-3">
            {threads.length === 0 ? <p className="text-sm text-[var(--muted)]">Inga konversationer ännu.</p> : null}
            {threads.map((thread) => (
              <Link
                key={thread.otherUserId}
                href={`/dashboard/konsument/messages/${thread.otherUserId}`}
                className="block rounded-xl border border-[var(--line)] bg-white p-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{thread.otherUserName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{thread.lastMessage}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    <p>{formatDate(thread.lastMessageAt)}</p>
                    <p>Olästa: {thread.unreadCount}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
