import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const verificationLabels: Record<string, string> = {
  pending: "Väntar",
  verified: "Verifierad",
  suspended: "Avstängd",
};

const planLabels: Record<string, string> = {
  none: "Ingen",
  trial: "Testperiod",
  active: "Aktiv",
  past_due: "Förfallen",
  canceled: "Avslutad",
};

export default async function AgentDashboardPage() {
  const user = await requireRole("agent", "/dashboard/maklare");
  const supabase = await createSupabaseServerClient();

  const [{ count: answerCount }, { count: profileViews }, { data: profile }] = await Promise.all([
    supabase.from("answers").select("id", { count: "exact", head: true }).eq("answered_by", user.id),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("verification_status, subscription_status, city, firm").eq("id", user.id).single(),
  ]);

  return (
    <div>
      <h1 className="text-4xl">Mäklardashboard</h1>
      <p className="mt-2 text-[var(--muted)]">Svar, profilprestanda, bevakade kommuner och notifikationsinställningar.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-2xl font-semibold">{answerCount ?? 0}</p>
          <p className="text-xs text-[var(--muted)]">Svar totalt</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{profileViews ?? 0}</p>
          <p className="text-xs text-[var(--muted)]">Aktiva frågor på plattformen</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{verificationLabels[profile?.verification_status ?? "pending"] ?? "Väntar"}</p>
          <p className="text-xs text-[var(--muted)]">Verifiering</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{planLabels[profile?.subscription_status ?? "none"] ?? "Ingen"}</p>
          <p className="text-xs text-[var(--muted)]">Planstatus</p>
        </div>
      </div>

      <section className="mt-6 card">
        <h2 className="text-xl">Profil</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{profile?.firm ?? "-"} | {profile?.city ?? "-"}</p>
      </section>
    </div>
  );
}
