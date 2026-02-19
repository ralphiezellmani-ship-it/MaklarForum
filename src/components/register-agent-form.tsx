"use client";

import { useActionState } from "react";
import { registerAgentAction } from "@/app/auth/actions";

export function RegisterAgentForm() {
  const [state, action, pending] = useActionState(registerAgentAction, undefined);

  return (
    <form action={action} className="mt-4 grid gap-3">
      <label className="block text-sm">
        Fullständigt namn
        <input name="full_name" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        Företagsmail
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        Lösenord
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        Mäklarfirma
        <input name="firm" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        FMI-nummer
        <input name="fmi_number" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        Stad
        <input name="city" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button className="pill pill-dark" disabled={pending}>
        {pending ? "Skickar in..." : "Skapa mäklarprofil"}
      </button>
    </form>
  );
}
