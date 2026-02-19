import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const tabs = [
  { href: "/dashboard/maklare", label: "Översikt" },
  { href: "/dashboard/maklare/messages", label: "Meddelanden" },
  { href: "/dashboard/maklare/grupper", label: "Grupper" },
  { href: "/forum", label: "Internt forum" },
];

export default async function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "agent") {
    return <>{children}</>;
  }

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="pill pill-light">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
