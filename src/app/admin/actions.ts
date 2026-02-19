"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function approveAgentAction(formData: FormData) {
  await requireRole("admin", "/admin");
  const agentId = String(formData.get("agent_id") ?? "");

  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ verification_status: "verified" }).eq("id", agentId);

  revalidatePath("/admin");
}

export async function rejectAgentAction(formData: FormData) {
  await requireRole("admin", "/admin");
  const agentId = String(formData.get("agent_id") ?? "");

  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ verification_status: "suspended" }).eq("id", agentId);

  revalidatePath("/admin");
}

export async function updateAgentEmailAction(formData: FormData) {
  await requireRole("admin", "/admin");
  const agentId = String(formData.get("agent_id") ?? "");
  const email = String(formData.get("new_email") ?? "").trim().toLowerCase();

  if (!email) {
    return;
  }

  const admin = createSupabaseAdminClient();

  await admin.auth.admin.updateUserById(agentId, {
    email,
    email_confirm: true,
  });

  await admin.from("profiles").update({ email }).eq("id", agentId);

  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData) {
  await requireRole("admin", "/admin");
  const userId = String(formData.get("user_id") ?? "");

  const admin = createSupabaseAdminClient();
  await admin.auth.admin.deleteUser(userId);

  revalidatePath("/admin");
}
