import { QuestionCard } from "@/components/question-card";
import { getQuestions } from "@/lib/data";

export default async function QuestionsPage() {
  const questions = await getQuestions();

  return (
    <div>
      <h1 className="text-4xl">Frågor & svar</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">
        Alla frågor är SEO-indexerade och kan besvaras av verifierade mäklare. Konsumenter kan jämföra svar sida vid sida.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}
