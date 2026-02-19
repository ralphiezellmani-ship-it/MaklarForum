"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/auth/actions";

export function LoginForm({ next, portal = "consumer" }: { next: string; portal?: "consumer" | "agent" }) {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="portal" value={portal} />
      <label className="block text-sm">
        E-post
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      <label className="block text-sm">
        Lösenord
        <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2" />
      </label>
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button className="pill pill-dark" disabled={pending}>
        {pending ? "Loggar in..." : portal === "agent" ? "Logga in som mäklare" : "Logga in som konsument"}
      </button>
    </form>
  );
}
