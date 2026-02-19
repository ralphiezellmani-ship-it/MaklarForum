"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendConsumerMessageAction(_: { error?: string; success?: string } | undefined, formData: FormData) {
  const user = await requireRole("consumer", "/dashboard/konsument/messages");
  const receiverId = String(formData.get("receiver_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);

  if (!receiverId || !body) {
    return { error: "Mottagare och meddelande krävs." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: blocked } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", receiverId)
    .limit(1)
    .maybeSingle();

  if (blocked) {
    return { error: "Du har blockerat den här mäklaren. Avblockera först för att skicka meddelande." };
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    body,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/konsument");
  revalidatePath("/dashboard/konsument/messages");
  return { success: "Meddelandet skickades." };
}

export async function sendConsumerConversationMessageAction(
  otherUserId: string,
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const user = await requireRole("consumer", `/dashboard/konsument/messages/${otherUserId}`);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);

  if (!body) {
    return { error: "Skriv ett meddelande innan du skickar." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: blocked } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", otherUserId)
    .limit(1)
    .maybeSingle();

  if (blocked) {
    return { error: "Du har blockerat den här mäklaren. Avblockera först för att skicka meddelande." };
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: otherUserId,
    body,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/konsument/messages/${otherUserId}`);
  revalidatePath("/dashboard/konsument/messages");
  revalidatePath("/dashboard/konsument");

  return { success: "Meddelandet skickades." };
}

export async function blockAgentAction(otherUserId: string) {
  const user = await requireRole("consumer", `/dashboard/konsument/messages/${otherUserId}`);
  const supabase = await createSupabaseServerClient();

  await supabase.from("user_blocks").upsert({
    blocker_id: user.id,
    blocked_id: otherUserId,
  });

  revalidatePath(`/dashboard/konsument/messages/${otherUserId}`);
  revalidatePath("/dashboard/konsument/messages");
}

export async function unblockAgentAction(otherUserId: string) {
  const user = await requireRole("consumer", `/dashboard/konsument/messages/${otherUserId}`);
  const supabase = await createSupabaseServerClient();

  await supabase.from("user_blocks").delete().eq("blocker_id", user.id).eq("blocked_id", otherUserId);

  revalidatePath(`/dashboard/konsument/messages/${otherUserId}`);
  revalidatePath("/dashboard/konsument/messages");
}
