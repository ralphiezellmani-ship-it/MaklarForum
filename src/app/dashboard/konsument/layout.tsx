import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const tabs = [
  { href: "/dashboard/konsument", label: "Mina frågor" },
  { href: "/dashboard/konsument/messages", label: "Meddelanden" },
  { href: "/fragor", label: "Ställ fråga" },
];

export default async function ConsumerDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "consumer") {
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
