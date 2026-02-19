import { agents as mockAgents, answers as mockAnswers, questions as mockQuestions } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function getQuestions() {
  if (!hasSupabaseEnv()) {
    return mockQuestions;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, question_slug, title, body, asked_by, audience, category, geo_scope, municipality, region, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return mockQuestions;
  }

  const answerCounts = await supabase.from("answers").select("question_id");

  return data.map((q) => {
    const count = answerCounts.data?.filter((a) => a.question_id === q.id).length ?? 0;

    return {
      id: q.id,
      slug: q.question_slug,
      title: q.title,
      body: q.body,
      askedBy: q.asked_by,
      audience: q.audience,
      category: q.category,
      geoScope: q.geo_scope,
      municipality: q.municipality ?? undefined,
      region: q.region ?? undefined,
      createdAt: q.created_at,
      helpfulVotes: 0,
      answerCount: count,
    };
  });
}

export async function getQuestionBySlug(slug: string) {
  const questions = await getQuestions();
  return questions.find((q) => q.slug === slug) ?? null;
}

export async function getAnswersForQuestion(questionId: string) {
  if (!hasSupabaseEnv()) {
    return mockAnswers
      .filter((answer) => answer.questionId === questionId)
      .map((answer) => ({
        ...answer,
        agent: mockAgents.find((agent) => agent.id === answer.answeredBy) ?? null,
      }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("answers")
    .select("id, question_id, answered_by, body, helpful_votes, created_at")
    .eq("question_id", questionId)
    .order("helpful_votes", { ascending: false });

  if (error || !data) {
    return [];
  }

  const ids = [...new Set(data.map((row) => row.answered_by))];
  const { data: agentProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_slug, firm, title, city, bio, fmi_number, verification_status, subscription_status")
    .in("id", ids);

  const agentMap = new Map((agentProfiles ?? []).map((a) => [a.id, a]));

  return data.map((row) => {
    const agent = agentMap.get(row.answered_by);
    return {
      id: row.id,
      questionId: row.question_id,
      answeredBy: row.answered_by,
      body: row.body,
      helpfulVotes: row.helpful_votes,
      createdAt: row.created_at,
      agent: agent
        ? {
            id: agent.id,
            fullName: agent.full_name,
            slug: agent.profile_slug,
            firm: agent.firm,
            title: agent.title,
            city: agent.city,
            municipalities: [],
            bio: agent.bio ?? "",
            fmiNumber: agent.fmi_number ?? "",
            verificationStatus: agent.verification_status,
            premium: agent.subscription_status === "active",
            soldCount: 0,
            activeCount: 0,
            profileViews: 0,
          }
        : null,
    };
  });
}

export async function getAgents() {
  if (!hasSupabaseEnv()) {
    return mockAgents;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, profile_slug, firm, title, city, bio, fmi_number, verification_status, subscription_status")
    .eq("role", "agent")
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return mockAgents;
  }

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    slug: row.profile_slug,
    firm: row.firm,
    title: row.title,
    city: row.city,
    municipalities: [],
    bio: row.bio ?? "",
    fmiNumber: row.fmi_number ?? "",
    verificationStatus: row.verification_status,
    premium: row.subscription_status === "active",
    soldCount: 0,
    activeCount: 0,
    profileViews: 0,
  }));
}

export async function getAgentBySlug(slug: string) {
  const agents = await getAgents();
  return agents.find((agent) => agent.slug === slug) ?? null;
}

export async function getAnswersByAgent(agentId: string) {
  if (!hasSupabaseEnv()) {
    return mockAnswers
      .filter((answer) => answer.answeredBy === agentId)
      .map((answer) => ({
        ...answer,
        question: mockQuestions.find((question) => question.id === answer.questionId) ?? null,
      }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("answers")
    .select("id, question_id, body, helpful_votes, created_at")
    .eq("answered_by", agentId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const questionIds = [...new Set(data.map((row) => row.question_id))];
  const { data: questions } = await supabase.from("questions").select("id, title").in("id", questionIds);
  const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));

  return data.map((row) => ({
    id: row.id,
    questionId: row.question_id,
    body: row.body,
    helpfulVotes: row.helpful_votes,
    createdAt: row.created_at,
    question: questionMap.get(row.question_id) ?? null,
  }));
}

export async function getPendingAgentVerifications() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, firm, fmi_number, created_at")
    .eq("role", "agent")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getAdminMetrics() {
  if (!hasSupabaseEnv()) {
    return {
      totalUsers: 0,
      verifiedAgents: 0,
      payingAgents: 0,
      flaggedItems: 0,
    };
  }

  const supabase = await createSupabaseServerClient();

  const [{ count: totalUsers }, { count: verifiedAgents }, { count: payingAgents }, { count: flaggedItems }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "agent").eq("verification_status", "verified"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "agent").eq("subscription_status", "active"),
    supabase.from("reported_content").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    verifiedAgents: verifiedAgents ?? 0,
    payingAgents: payingAgents ?? 0,
    flaggedItems: flaggedItems ?? 0,
  };
}
