"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateAgentProfileAction(_: { error?: string; success?: string } | undefined, formData: FormData) {
  const user = await requireRole("agent", "/dashboard/maklare");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const firm = String(formData.get("firm") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!fullName || !firm || !title || !city) {
    return { error: "Namn, firma, titel och stad är obligatoriska." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      firm,
      title,
      city,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/maklare");
  revalidatePath("/maklare");
  return { success: "Profilen uppdaterades." };
}

export async function sendMessageAction(_: { error?: string; success?: string } | undefined, formData: FormData) {
  const user = await requireRole("agent", "/dashboard/maklare");
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

  revalidatePath("/dashboard/maklare");
  return { success: "Meddelandet skickades." };
}
