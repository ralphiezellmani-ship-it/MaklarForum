"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendConsumerMessageAction(_: { error?: string; success?: string } | undefined, formData: FormData) {
  const user = await requireRole("consumer", "/dashboard/konsument/messages");
  const receiverId = String(formData.get("receiver_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!receiverId || !body) {
    return { error: "Mottagare och meddelande krävs." };
  }

  const supabase = await createSupabaseServerClient();
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
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return { error: "Skriv ett meddelande innan du skickar." };
  }

  const supabase = await createSupabaseServerClient();
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
