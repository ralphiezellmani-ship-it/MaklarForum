"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { canPublish } from "@/lib/moderation";

type AnswerState = { error?: string; success?: string };

type AskState = { error?: string; success?: string };

export async function submitAnswerAction(questionId: string, slug: string, _: AnswerState | undefined, formData: FormData) {
  const user = await requireRole("agent", `/fragor/${slug}`);
  const supabase = await createSupabaseServerClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Svar kan inte vara tomt." };
  }

  const moderation = canPublish(body);
  if (!moderation.ok) {
    const { error: moderationError } = await supabase.from("moderation_queue").insert({
      item_type: "answer",
      question_id: questionId,
      proposed_by: user.id,
      body,
      blocked_terms: moderation.blocked,
      status: "pending",
    });
    if (moderationError) {
      return { error: moderationError.message };
    }
    revalidatePath("/admin");
    return { success: "Svar skickat till admin för granskning innan publicering." };
  }

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
  const { data: insertedQuestion, error } = await supabase
    .from("questions")
    .insert({
      asked_by: user.id,
      title,
      question_slug: `${slug}-${Date.now().toString().slice(-6)}`,
      body,
      audience,
      category,
      geo_scope: geoScope,
      municipality: municipality || null,
      region: region || null,
    })
    .select("id, geo_scope, municipality, region")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (insertedQuestion) {
    const admin = createSupabaseAdminClient();
    const { data: verifiedAgents } = await admin
      .from("profiles")
      .select("id, city")
      .eq("role", "agent")
      .eq("verification_status", "verified");
    const verifiedSet = new Set((verifiedAgents ?? []).map((agent) => agent.id));

    let recipientIds = (verifiedAgents ?? []).map((agent) => agent.id);

    if ((insertedQuestion.geo_scope === "local" || insertedQuestion.geo_scope === "regional") && (insertedQuestion.municipality || insertedQuestion.region)) {
      const { data: areaMatches } = await admin
        .from("agent_areas")
        .select("agent_id, municipality, region");

      const localMunicipality = (insertedQuestion.municipality ?? "").toLowerCase();
      const localRegion = (insertedQuestion.region ?? "").toLowerCase();

      recipientIds = (areaMatches ?? [])
        .filter((area) => {
          if (insertedQuestion.geo_scope === "local") {
            return (area.municipality ?? "").toLowerCase() === localMunicipality;
          }
          return (area.region ?? "").toLowerCase() === localRegion;
        })
        .map((area) => area.agent_id);
    }

    recipientIds = [...new Set(recipientIds)].filter((id) => verifiedSet.has(id));

    if (recipientIds.length > 0) {
      await admin.from("lead_dispatch_logs").insert(
        recipientIds.map((agentId) => ({
          agent_id: agentId,
          question_id: insertedQuestion.id,
          dispatch_type: "tip",
          status: "sent",
          payload: {
            source: "question_created",
          },
          dispatched_at: new Date().toISOString(),
        })),
      );
    }
  }

  revalidatePath("/fragor");
  revalidatePath("/dashboard/konsument");

  return { success: "Frågan är publicerad." };
}

export async function toggleWatchThreadAction(questionId: string, slug: string, watching: boolean) {
  const user = await requireUser(`/fragor/${slug}`);
  const supabase = await createSupabaseServerClient();

  if (watching) {
    await supabase.from("question_watchers").delete().eq("question_id", questionId).eq("user_id", user.id);
  } else {
    await supabase.from("question_watchers").insert({
      question_id: questionId,
      user_id: user.id,
    });
  }

  revalidatePath(`/fragor/${slug}`);
  revalidatePath("/dashboard/konsument");
  revalidatePath("/dashboard/maklare");
}
