"use client";

import { useActionState } from "react";
import { registerConsumerAction } from "@/app/auth/actions";

export function RegisterConsumerForm() {
  const [state, action, pending] = useActionState(registerConsumerAction, undefined);

  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">
        Fullständigt namn
        <input name="full_name" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        E-post
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        Lösenord
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button className="pill pill-dark" disabled={pending}>
        {pending ? "Skapar konto..." : "Skapa konto"}
      </button>
    </form>
  );
}
