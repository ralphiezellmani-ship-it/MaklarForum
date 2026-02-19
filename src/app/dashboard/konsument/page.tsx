import Link from "next/link";
import { QuestionCreateForm } from "@/components/question-create-form";
import { requireRole } from "@/lib/auth";
import { getQuestions } from "@/lib/data";

export default async function ConsumerDashboardPage() {
  const user = await requireRole("consumer", "/dashboard/konsument");
  const questions = await getQuestions();
  const own = questions.filter((question) => question.askedBy === user.id);

  return (
    <div>
      <h1 className="text-4xl">Mina frågor</h1>
      <p className="mt-2 text-[var(--muted)]">Översikt för konsument: status, bevakning och meddelanden till mäklare.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="metric">
          <p className="text-2xl font-semibold">{own.length}</p>
          <p className="text-xs text-[var(--muted)]">Aktiva frågor</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{own.reduce((acc, q) => acc + q.answerCount, 0)}</p>
          <p className="text-xs text-[var(--muted)]">Totala svar</p>
        </div>
        <div className="metric">
          <p className="text-2xl font-semibold">{own.filter((q) => q.answerCount > 0).length}</p>
          <p className="text-xs text-[var(--muted)]">Besvarade</p>
        </div>
      </div>

      <QuestionCreateForm />

      <div className="mt-6 grid gap-4">
        {own.map((question) => (
          <article key={question.id} className="card">
            <h2 className="text-lg font-semibold">{question.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Status: {question.answerCount > 0 ? "Besvarad" : "Öppet"} | {question.answerCount} svar
            </p>
            <Link href={`/fragor/${question.slug}`} className="mt-3 inline-block text-sm text-[var(--accent)]">
              Öppna fråga
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
