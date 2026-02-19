// Dispatches notifications to matching agents when a new question is inserted.
// Intended runtime: Supabase Edge Functions (Deno)

export {};

interface QuestionPayload {
  id: string;
  title: string;
  geo_scope: "local" | "regional" | "open";
  municipality?: string;
  region?: string;
}

type DenoLike = {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const denoRuntime = (globalThis as { Deno?: DenoLike }).Deno;

if (denoRuntime) {
  denoRuntime.serve(async (req) => {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = (await req.json()) as { record: QuestionPayload };

    // TODO:
    // 1) Query agent_areas + profiles (verified agents) based on geo_scope
    // 2) Respect notification_prefs.new_question_email
    // 3) Send email via Resend API with direct question link
    // 4) Write dispatch logs for admin observability

    return Response.json({ ok: true, questionId: payload.record.id });
  });
}
