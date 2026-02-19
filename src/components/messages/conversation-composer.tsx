"use client";

import { useActionState } from "react";

type ActionState = { error?: string; success?: string };

export function ConversationComposer({
  action,
}: {
  action: (state: ActionState | undefined, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-4 grid gap-2">
      <textarea
        name="body"
        required
        maxLength={5000}
        placeholder="Skriv svar..."
        className="min-h-24 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
      />
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button className="pill pill-dark w-fit" disabled={pending}>
        {pending ? "Skickar..." : "Skicka"}
      </button>
    </form>
  );
}
