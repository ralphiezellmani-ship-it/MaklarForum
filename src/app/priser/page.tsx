import Link from "next/link";
import { PremiumCheckoutButton } from "@/components/premium-checkout-button";
import { getCurrentUser } from "@/lib/auth";

const plans = [
  {
    name: "Bas",
    price: "0 kr / mån",
    features: ["Verifierad profil", "Svara på frågor", "Synlig i sökresultat"],
  },
  {
    name: "Premium",
    price: "299-499 kr / mån",
    features: ["Prioriterad synlighet", "Realtidsnotiser", "Profilstatistik", "Alla objekt"],
  },
  {
    name: "Leads",
    price: "3 000 kr / mån",
    features: ["Automatisk leadsdistribution", "Kontorsnivå", "Lanseras i fas 3"],
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-4xl">Priser</h1>
      <p className="mt-2 max-w-3xl text-[var(--muted)]">
        Stripe är förberett för att kunna aktivera betalning direkt, samtidigt som du kan ge gratisperiod till tidiga användare.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="card">
            <h2 className="text-2xl">{plan.name}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature}>| {feature}</li>
              ))}
            </ul>
            {plan.name === "Premium" ? (
              <div className="mt-4">
                {user?.role === "agent" ? (
                  <PremiumCheckoutButton />
                ) : (
                  <Link href="/login?next=/priser" className="pill pill-light">
                    Logga in som mäklare
                  </Link>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
