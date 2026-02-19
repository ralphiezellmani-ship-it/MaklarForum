"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { canPublish } from "@/lib/moderation";

type AnswerState = { error?: string; success?: string };

type AskState = { error?: string; success?: string };
type VoteState = { error?: string; success?: string };
type TipState = { error?: string; success?: string };

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

export async function voteAnswerAction(_: VoteState | undefined, formData: FormData) {
  const user = await requireRole("consumer", "/fragor");

  const answerId = String(formData.get("answer_id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const voteRaw = Number(formData.get("vote") ?? 0);
  const vote = voteRaw === -1 ? -1 : 1;

  if (!answerId || !slug) {
    return { error: "Ogiltig röst." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("answer_votes")
    .select("vote")
    .eq("answer_id", answerId)
    .eq("consumer_id", user.id)
    .maybeSingle();

  if (existing && existing.vote === vote) {
    await supabase.from("answer_votes").delete().eq("answer_id", answerId).eq("consumer_id", user.id);
  } else {
    await supabase.from("answer_votes").upsert({
      answer_id: answerId,
      consumer_id: user.id,
      vote,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/fragor/${slug}`);
  revalidatePath("/dashboard/konsument");
  return { success: "Röst registrerad." };
}

export async function createAgentTipAction(_: TipState | undefined, formData: FormData) {
  const user = await requireRole("agent", "/dashboard/maklare/fragor");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "general");
  const geoScope = String(formData.get("geo_scope") ?? "open");
  const municipality = String(formData.get("municipality") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (!title || !body) {
    return { error: "Rubrik och innehåll krävs." };
  }

  const moderation = canPublish(body);
  if (!moderation.ok) {
    return { error: `Tips blockerat. Otillåtna ord: ${moderation.blocked.join(", ")}` };
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.verification_status !== "verified") {
    return { error: "Din mäklarprofil måste vara verifierad för att publicera tips." };
  }

  const { error } = await supabase.from("agent_tips").insert({
    author_id: user.id,
    title,
    body,
    audience,
    geo_scope: geoScope,
    municipality: municipality || null,
    region: region || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/maklare/fragor");
  revalidatePath("/fragor");
  return { success: "Tipset publicerades." };
}

export async function voteTipAction(_: VoteState | undefined, formData: FormData) {
  const user = await requireRole("consumer", "/fragor");
  const tipId = String(formData.get("tip_id") ?? "").trim();
  const voteRaw = Number(formData.get("vote") ?? 0);
  const vote = voteRaw === -1 ? -1 : 1;

  if (!tipId) {
    return { error: "Ogiltig röst." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("agent_tip_votes")
    .select("vote")
    .eq("tip_id", tipId)
    .eq("consumer_id", user.id)
    .maybeSingle();

  if (existing && existing.vote === vote) {
    await supabase.from("agent_tip_votes").delete().eq("tip_id", tipId).eq("consumer_id", user.id);
  } else {
    await supabase.from("agent_tip_votes").upsert({
      tip_id: tipId,
      consumer_id: user.id,
      vote,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath("/fragor");
  revalidatePath("/dashboard/konsument");
  return { success: "Röst registrerad." };
}
