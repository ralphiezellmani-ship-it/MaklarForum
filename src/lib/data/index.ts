import { agents as mockAgents, answers as mockAnswers, questions as mockQuestions } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { AgentGroup, ConversationMessage, MessageThread, PendingModerationItem, WatchedThread } from "@/lib/types";

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

export async function getPendingGroupApprovals() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_groups")
    .select("id, name, municipality, region, created_at, created_by")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) {
    return [];
  }

  const creatorIds = [...new Set(data.map((row) => row.created_by))];
  const { data: creators } = await supabase.from("profiles").select("id, full_name").in("id", creatorIds);
  const creatorMap = new Map((creators ?? []).map((creator) => [creator.id, creator.full_name]));

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    municipality: row.municipality ?? "",
    region: row.region ?? "",
    createdAt: row.created_at,
    createdBy: creatorMap.get(row.created_by) ?? "Mäklare",
  }));
}

export async function getPendingModerationItems(): Promise<PendingModerationItem[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("moderation_queue")
    .select("id, question_id, proposed_by, body, blocked_terms, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) {
    return [];
  }

  const questionIds = [...new Set(rows.map((row) => row.question_id).filter(Boolean))] as string[];
  const proposerIds = [...new Set(rows.map((row) => row.proposed_by))];

  const { data: questions } =
    questionIds.length > 0
      ? await supabase.from("questions").select("id, title").in("id", questionIds)
      : { data: [] as Array<{ id: string; title: string }> };
  const { data: proposers } = await supabase.from("profiles").select("id, full_name").in("id", proposerIds);

  const questionMap = new Map((questions ?? []).map((question) => [question.id, question.title]));
  const proposerMap = new Map((proposers ?? []).map((profile) => [profile.id, profile.full_name]));

  return rows.map((row) => ({
    id: row.id,
    questionId: row.question_id,
    questionTitle: row.question_id ? (questionMap.get(row.question_id) ?? "Okänd fråga") : "Okänd fråga",
    proposedBy: row.proposed_by,
    proposedByName: proposerMap.get(row.proposed_by) ?? "Mäklare",
    body: row.body,
    blockedTerms: row.blocked_terms ?? [],
    createdAt: row.created_at,
  }));
}

export async function getAgentProfile(userId: string) {
  if (!hasSupabaseEnv()) {
    return mockAgents[0];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, profile_slug, firm, title, city, bio, fmi_number, verification_status, subscription_status")
    .eq("id", userId)
    .single();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    slug: data.profile_slug,
    firm: data.firm,
    title: data.title,
    city: data.city,
    municipalities: [],
    bio: data.bio ?? "",
    fmiNumber: data.fmi_number ?? "",
    verificationStatus: data.verification_status,
    premium: data.subscription_status === "active",
    soldCount: 0,
    activeCount: 0,
    profileViews: 0,
  };
}

export async function getAgentLeadMetrics(userId: string) {
  if (!hasSupabaseEnv()) {
    return { sentTotal: 0, sentLast30Days: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: sentTotal }, { count: sentLast30Days }] = await Promise.all([
    supabase.from("lead_dispatch_logs").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("status", "sent"),
    supabase
      .from("lead_dispatch_logs")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", userId)
      .eq("status", "sent")
      .gte("created_at", since),
  ]);

  return {
    sentTotal: sentTotal ?? 0,
    sentLast30Days: sentLast30Days ?? 0,
  };
}

export async function getAgentGroupsForUser(userId: string): Promise<AgentGroup[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: groups }, { data: memberships }] = await Promise.all([
    supabase
      .from("agent_groups")
      .select("id, name, slug, description, municipality, region, status")
      .in("status", ["approved", "pending"])
      .order("name", { ascending: true }),
    supabase.from("agent_group_members").select("group_id").eq("agent_id", userId),
  ]);

  if (!groups || groups.length === 0) {
    return [];
  }

  const groupIds = groups.map((group) => group.id);
  const { data: allMembers } = await supabase.from("agent_group_members").select("group_id").in("group_id", groupIds);
  const memberCountMap = new Map<string, number>();
  for (const member of allMembers ?? []) {
    memberCountMap.set(member.group_id, (memberCountMap.get(member.group_id) ?? 0) + 1);
  }

  const joined = new Set((memberships ?? []).map((row) => row.group_id));

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description ?? "",
    municipality: group.municipality ?? "",
    region: group.region ?? "",
    status: group.status,
    memberCount: memberCountMap.get(group.id) ?? 0,
    isMember: joined.has(group.id),
  }));
}

export async function getAgentDashboardQuestionFeed(userId: string): Promise<
  Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    geoScope: string;
    municipality: string | null;
    region: string | null;
    createdAt: string;
    answeredByMe: boolean;
  }>
> {
  if (!hasSupabaseEnv()) {
    return mockQuestions.slice(0, 20).map((question) => ({
      id: question.id,
      slug: question.slug,
      title: question.title,
      category: question.category,
      geoScope: question.geoScope,
      municipality: question.municipality ?? null,
      region: question.region ?? null,
      createdAt: question.createdAt,
      answeredByMe: false,
    }));
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: areaRows }, { data: answers }, { data: questions }] = await Promise.all([
    supabase.from("profiles").select("city").eq("id", userId).maybeSingle(),
    supabase.from("agent_areas").select("municipality, region").eq("agent_id", userId),
    supabase.from("answers").select("question_id").eq("answered_by", userId),
    supabase
      .from("questions")
      .select("id, question_slug, title, category, geo_scope, municipality, region, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (!questions || questions.length === 0) {
    return [];
  }

  const answeredIds = new Set((answers ?? []).map((row) => row.question_id));
  const municipalities = new Set<string>();
  const regions = new Set<string>();

  if (profile?.city) {
    municipalities.add(profile.city.toLowerCase());
  }

  for (const row of areaRows ?? []) {
    if (row.municipality) municipalities.add(row.municipality.toLowerCase());
    if (row.region) regions.add(row.region.toLowerCase());
  }

  const hasGeoPrefs = municipalities.size > 0 || regions.size > 0;

  const visible = questions.filter((question) => {
    if (!hasGeoPrefs) {
      return true;
    }

    if (question.geo_scope === "open") {
      return true;
    }

    if (question.geo_scope === "local") {
      return municipalities.has((question.municipality ?? "").toLowerCase());
    }

    if (question.geo_scope === "regional") {
      return regions.has((question.region ?? "").toLowerCase());
    }

    return true;
  });

  return visible.map((question) => ({
    id: question.id,
    slug: question.question_slug,
    title: question.title,
    category: question.category,
    geoScope: question.geo_scope,
    municipality: question.municipality,
    region: question.region,
    createdAt: question.created_at,
    answeredByMe: answeredIds.has(question.id),
  }));
}

export async function getWatchedThreads(userId: string): Promise<WatchedThread[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: watcherRows } = await supabase
    .from("question_watchers")
    .select("question_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!watcherRows || watcherRows.length === 0) {
    return [];
  }

  const questionIds = watcherRows.map((row) => row.question_id);
  const { data: questionRows } = await supabase
    .from("questions")
    .select("id, question_slug, title, created_at")
    .in("id", questionIds);
  const { data: answerRows } = await supabase.from("answers").select("question_id").in("question_id", questionIds);

  const questionMap = new Map((questionRows ?? []).map((row) => [row.id, row]));

  return watcherRows
    .map((watch) => {
      const question = questionMap.get(watch.question_id);
      if (!question) return null;

      return {
        questionId: question.id,
        questionSlug: question.question_slug,
        title: question.title,
        createdAt: question.created_at,
        answerCount: answerRows?.filter((answer) => answer.question_id === question.id).length ?? 0,
      };
    })
    .filter((row): row is WatchedThread => Boolean(row));
}

export async function getMessageThreads(userId: string): Promise<MessageThread[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, body, read_at, created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) {
    return [];
  }

  const grouped = new Map<string, typeof rows>();

  for (const row of rows) {
    const otherUserId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    const bucket = grouped.get(otherUserId) ?? [];
    bucket.push(row);
    grouped.set(otherUserId, bucket);
  }

  const otherIds = [...grouped.keys()];
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, role").in("id", otherIds);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return [...grouped.entries()].map(([otherUserId, messages]) => {
    const latest = messages[0];
    const unreadCount = messages.filter((message) => message.receiver_id === userId && message.read_at === null).length;
    const other = profileMap.get(otherUserId);

    return {
      otherUserId,
      otherUserName: other?.full_name ?? "Användare",
      otherUserRole: (other?.role ?? "consumer") as "consumer" | "agent" | "admin",
      lastMessage: latest.body,
      lastMessageAt: latest.created_at,
      unreadCount,
    };
  });
}

export async function getPotentialMessageRecipientsFromWatched(userId: string): Promise<Array<{ id: string; name: string }>> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: watched } = await supabase.from("question_watchers").select("question_id").eq("user_id", userId);
  const questionIds = watched?.map((row) => row.question_id) ?? [];
  if (questionIds.length === 0) {
    return [];
  }

  const { data: questions } = await supabase.from("questions").select("asked_by").in("id", questionIds);
  const userIds = [...new Set((questions ?? []).map((row) => row.asked_by).filter((id) => id !== userId))];
  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
  return (profiles ?? []).map((profile) => ({ id: profile.id, name: profile.full_name }));
}

export async function getConversation(userId: string, otherUserId: string): Promise<ConversationMessage[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, body, created_at, read_at")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) {
    return [];
  }

  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", [userId, otherUserId]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return rows.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
    senderName: profileMap.get(row.sender_id) ?? "Användare",
  }));
}

export async function markConversationAsRead(userId: string, otherUserId: string) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", userId)
    .eq("sender_id", otherUserId)
    .is("read_at", null);
}

export async function getVerifiedAgentRecipients() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, city, firm")
    .eq("role", "agent")
    .eq("verification_status", "verified")
    .order("full_name", { ascending: true });

  return (data ?? []).map((agent) => ({
    id: agent.id,
    name: `${agent.full_name}${agent.city ? ` - ${agent.city}` : ""}${agent.firm ? ` (${agent.firm})` : ""}`,
  }));
}
