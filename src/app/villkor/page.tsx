export default function TermsPage() {
  return (
    <article className="card max-w-4xl">
      <h1 className="text-4xl">Användarvillkor</h1>
      <p className="mt-4 text-sm text-[var(--muted)]">Senast uppdaterad: 18 februari 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <p>Mäklarforum.se tillhandahåller en offentlig Q&A-plattform mellan konsumenter och verifierade fastighetsmäklare i Sverige.</p>
        <p>Mäklare måste registrera korrekt identitet, företagsanknuten e-post och giltigt FMI-nummer. Felaktiga uppgifter leder till avstängning utan återbetalning.</p>
        <p>Varje mäklare får ge ett svar per fråga samt en uppföljningskommentar på eget svar. Debatt mot andra mäklare i samma tråd är inte tillåten.</p>
        <p>Otillåten ton, vilseledande information och personangrepp kan leda till omedelbar modereringsåtgärd eller kontostängning.</p>
        <p>Prenumerationer för premium och leads hanteras via Stripe. Betalningar och fakturering följer aktiv plan och uppsägningstid i respektive abonnemang.</p>
      </div>
    </article>
  );
}
