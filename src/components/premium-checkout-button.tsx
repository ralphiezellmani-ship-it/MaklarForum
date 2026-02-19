"use client";

import { useState } from "react";

export function PremiumCheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/create-checkout", {
      method: "POST",
    });

    const payload = await response.json();

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Kunde inte starta betalningen.");
      setLoading(false);
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <div>
      <button className="pill pill-dark" onClick={startCheckout} disabled={loading}>
        {loading ? "Startar betalning..." : "Aktivera Premium"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
