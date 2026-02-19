import { RegisterConsumerForm } from "@/components/register-consumer-form";

export default function RegisterConsumerPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-3xl">Skapa konsumentkonto</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Registrering för köpare och säljare.</p>
        <RegisterConsumerForm />
      </div>
    </div>
  );
}
