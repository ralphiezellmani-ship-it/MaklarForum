"use client";

import { useActionState } from "react";

type ActionState = { error?: string; success?: string };

export function AnswerComposer({
  action,
}: {
  action: (state: ActionState | undefined, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <section className="card">
      <h3 className="text-lg font-semibold">Svara på frågan (mäklare)</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Ett svar per mäklare och fråga. Otillåtna ord blockeras automatiskt.
      </p>
      <form action={formAction} className="mt-4">
        <textarea
          name="body"
          className="min-h-36 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
          placeholder="Skriv ett tydligt och hjälpsamt svar till konsumenten..."
          required
        />
        {state?.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
        {state?.success ? <p className="mt-2 text-sm text-emerald-700">{state.success}</p> : null}
        <button type="submit" disabled={pending} className="mt-4 pill pill-dark disabled:opacity-40">
          {pending ? "Publicerar..." : "Publicera svar"}
        </button>
      </form>
    </section>
  );
}
