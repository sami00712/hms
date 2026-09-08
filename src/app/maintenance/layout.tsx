import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Report Issue", href: "/maintenance/report" }
];

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardShell role={(session.user as any)?.role || "Staff"} userName={session.user.name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
