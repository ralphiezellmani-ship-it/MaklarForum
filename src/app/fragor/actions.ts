"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canPublish } from "@/lib/moderation";

type AnswerState = { error?: string; success?: string };

type AskState = { error?: string; success?: string };

export async function submitAnswerAction(questionId: string, slug: string, _: AnswerState | undefined, formData: FormData) {
  const user = await requireRole("agent", `/fragor/${slug}`);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Svar kan inte vara tomt." };
  }

  const moderation = canPublish(body);
  if (!moderation.ok) {
    return { error: `Svar blockerat. Otillåtna ord: ${moderation.blocked.join(", ")}` };
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.verification_status !== "verified") {
    return { error: "Din mäklarprofil är inte verifierad ännu." };
  }

  const { error } = await supabase.from("answers").insert({
    question_id: questionId,
    answered_by: user.id,
    body,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/fragor/${slug}`);
  return { success: "Svar publicerat." };
}

export async function askQuestionAction(_: AskState | undefined, formData: FormData) {
  const user = await requireRole("consumer", "/dashboard/konsument");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "general");
  const category = String(formData.get("category") ?? "ovrigt");
  const geoScope = String(formData.get("geo_scope") ?? "open");
  const municipality = String(formData.get("municipality") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (!title || !body) {
    return { error: "Rubrik och fråga är obligatoriska." };
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("questions").insert({
    asked_by: user.id,
    title,
    question_slug: `${slug}-${Date.now().toString().slice(-6)}`,
    body,
    audience,
    category,
    geo_scope: geoScope,
    municipality: municipality || null,
    region: region || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/fragor");
  revalidatePath("/dashboard/konsument");

  return { success: "Frågan är publicerad." };
}
