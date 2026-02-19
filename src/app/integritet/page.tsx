export default function PrivacyPage() {
  return (
    <article className="card max-w-4xl">
      <h1 className="text-4xl">Integritetspolicy</h1>
      <p className="mt-4 text-sm text-[var(--muted)]">Senast uppdaterad: 18 februari 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <p>Vi behandlar personuppgifter för att tillhandahålla konto, verifiering, notifikationer och meddelanden mellan användare.</p>
        <p>För mäklare behandlas namn, kontaktuppgifter, företag, FMI-nummer och aktivitet på plattformen för trygghet och kundsäkerhet.</p>
        <p>Kommunikation om konto, frågor och svar skickas via e-post enligt dina notifikationsinställningar.</p>
        <p>Vi delar inte personuppgifter med tredje part utöver nödvändiga underbiträden för drift, exempelvis Supabase, Vercel, Resend, Stripe och Fortnox.</p>
        <p>Du kan när som helst begära registerutdrag, rättelse eller radering i enlighet med GDPR genom att kontakta support@maklarforum.se.</p>
      </div>
    </article>
  );
}
