"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendConversationMessageAction(
  otherUserId: string,
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const user = await requireRole("agent", `/dashboard/maklare/messages/${otherUserId}`);
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

  revalidatePath(`/dashboard/maklare/messages/${otherUserId}`);
  revalidatePath("/dashboard/maklare/messages");
  revalidatePath("/dashboard/maklare");

  return { success: "Meddelandet skickades." };
}
