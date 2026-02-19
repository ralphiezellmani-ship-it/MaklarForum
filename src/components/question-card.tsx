import Link from "next/link";
import { Question } from "@/lib/types";
import { formatDate } from "@/lib/format";

const geoScopeLabels: Record<string, string> = {
  local: "Lokal",
  regional: "Regional",
  open: "Öppen",
};

const categoryLabels: Record<string, string> = {
  kopa: "Köpa",
  salja: "Sälja",
  juridik: "Juridik",
  vardering: "Värdering",
  flytt: "Flytt",
  ovrigt: "Övrigt",
};

export function QuestionCard({ question }: { question: Question }) {
  return (
    <article className="card">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span>{formatDate(question.createdAt)}</span>
        <span>|</span>
        <span>{geoScopeLabels[question.geoScope] ?? question.geoScope}</span>
        <span>|</span>
        <span>{categoryLabels[question.category] ?? question.category}</span>
      </div>
      <h3 className="text-lg font-semibold leading-tight">
        <Link href={`/fragor/${question.slug}`}>{question.title}</Link>
      </h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{question.body}</p>
      <div className="mt-4 flex gap-4 text-xs text-[var(--muted)]">
        <span>{question.answerCount} svar</span>
        <span>{question.helpfulVotes} hjälpsamt-röster</span>
      </div>
    </article>
  );
}
