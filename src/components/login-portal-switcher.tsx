"use client";

import { useRouter } from "next/navigation";

type Portal = "consumer" | "agent";

export function LoginPortalSwitcher({ portal, next }: { portal: Portal; next: string }) {
  const router = useRouter();

  return (
    <label className="block text-sm">
      Inloggningssida
      <select
        value={portal}
        onChange={(event) => {
          const selected = event.target.value as Portal;
          const basePath = selected === "agent" ? "/login/maklare" : "/login";
          router.push(`${basePath}?next=${encodeURIComponent(next)}`);
        }}
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2"
      >
        <option value="consumer">Konsument</option>
        <option value="agent">Mäklare</option>
      </select>
    </label>
  );
}
