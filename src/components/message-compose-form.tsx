"use client";

import { useActionState } from "react";

type ActionState = { error?: string; success?: string };

export function MessageComposeForm({
  recipients,
  action,
}: {
  recipients: Array<{ id: string; name: string }>;
  action: (state: ActionState | undefined, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-3 text-sm">
      <label>
        Mottagare
        <select name="receiver_id" required className="mt-1 w-full rounded-xl border border-[var(--line)] p-2">
          <option value="">Välj mottagare</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Meddelande
        <textarea name="body" required maxLength={5000} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] p-2" />
      </label>
      {state?.error ? <p className="text-red-700">{state.error}</p> : null}
      {state?.success ? <p className="text-emerald-700">{state.success}</p> : null}
      <button className="pill pill-dark w-fit" disabled={pending}>
        {pending ? "Skickar..." : "Skicka meddelande"}
      </button>
    </form>
  );
}
