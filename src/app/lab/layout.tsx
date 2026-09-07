import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Lab Orders", href: "/lab" }
];

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["LAB", "ADMIN"].includes(role)) redirect("/login");

  return (
    <DashboardShell role="Lab" userName={session.user.name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
