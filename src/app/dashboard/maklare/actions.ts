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

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function createAgentGroupAction(_: { error?: string; success?: string } | undefined, formData: FormData) {
  const user = await requireRole("agent", "/dashboard/maklare/grupper");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const municipality = String(formData.get("municipality") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (!name || !municipality || !region) {
    return { error: "Namn, kommun och region är obligatoriskt." };
  }

  const supabase = await createSupabaseServerClient();
  const slug = `${toSlug(name)}-${Date.now().toString().slice(-5)}`;
  const { data: group, error } = await supabase
    .from("agent_groups")
    .insert({
      name,
      slug,
      description: description || null,
      municipality,
      region,
      created_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (group) {
    await supabase.from("agent_group_members").insert({
      group_id: group.id,
      agent_id: user.id,
      role: "owner",
    });
  }

  revalidatePath("/dashboard/maklare/grupper");
  revalidatePath("/admin");

  return { success: "Gruppen skapades och ligger nu för admin-godkännande." };
}

export async function joinAgentGroupAction(groupId: string) {
  const user = await requireRole("agent", "/dashboard/maklare/grupper");
  const supabase = await createSupabaseServerClient();

  await supabase.from("agent_group_members").insert({
    group_id: groupId,
    agent_id: user.id,
    role: "member",
  });

  revalidatePath("/dashboard/maklare/grupper");
}

export async function leaveAgentGroupAction(groupId: string) {
  const user = await requireRole("agent", "/dashboard/maklare/grupper");
  const supabase = await createSupabaseServerClient();

  await supabase.from("agent_group_members").delete().eq("group_id", groupId).eq("agent_id", user.id);

  revalidatePath("/dashboard/maklare/grupper");
}
