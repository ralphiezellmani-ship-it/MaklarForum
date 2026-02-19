import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getConversation, getMessageThreads, markConversationAsRead } from "@/lib/data";
import { blockAgentAction, sendConsumerConversationMessageAction, unblockAgentAction } from "@/app/dashboard/konsument/messages/actions";
import { ConversationComposer } from "@/components/messages/conversation-composer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ConsumerConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await requireRole("consumer", `/dashboard/konsument/messages/${userId}`);

  const [threads, conversation] = await Promise.all([getMessageThreads(user.id), getConversation(user.id, userId)]);

  const thread = threads.find((item) => item.otherUserId === userId);
  if (!thread) {
    notFound();
  }

  await markConversationAsRead(user.id, userId);

  const sendAction = sendConsumerConversationMessageAction.bind(null, userId);
  const supabase = await createSupabaseServerClient();
  const { data: blockRow } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", userId)
    .limit(1)
    .maybeSingle();
  const isBlocked = Boolean(blockRow);

  return (
    <div>
      <Link href="/dashboard/konsument/messages" className="text-sm text-[var(--accent)]">
        ← Till inkorg
      </Link>
      <h1 className="mt-2 text-3xl">{thread.otherUserName}</h1>
      {thread.otherUserRole === "agent" ? (
        <div className="mt-2">
          {isBlocked ? (
            <form action={unblockAgentAction.bind(null, userId)}>
              <button className="pill pill-light">Avblockera mäklare</button>
            </form>
          ) : (
            <form action={blockAgentAction.bind(null, userId)}>
              <button className="pill pill-light">Blockera mäklare</button>
            </form>
          )}
        </div>
      ) : null}

      <section className="mt-4 card">
        <div className="space-y-3">
          {conversation.map((message) => {
            const mine = message.senderId === user.id;
            return (
              <div key={message.id} className={`rounded-xl border p-3 text-sm ${mine ? "border-emerald-300 bg-emerald-50" : "border-[var(--line)] bg-white"}`}>
                <p className="font-medium">{mine ? "Du" : message.senderName}</p>
                <p className="mt-1">{message.body}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{formatDate(message.createdAt)}</p>
              </div>
            );
          })}
        </div>

        {isBlocked ? <p className="mt-4 text-sm text-[var(--muted)]">Du har blockerat den här mäklaren. Avblockera för att skriva igen.</p> : <ConversationComposer action={sendAction} />}
      </section>
    </div>
  );
}
