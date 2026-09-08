import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "/receptionist" },
  { label: "Patients", href: "/receptionist/patients" },
  { label: "Appointments", href: "/receptionist/appointments" },
  { label: "OPD Token", href: "/receptionist/opd" },
  { label: "Admissions", href: "/receptionist/admissions" },
  { label: "Lab Billing", href: "/receptionist/lab-billing" },
  { label: "Lab Reports", href: "/receptionist/lab-reports" },
  { label: "Billing", href: "/receptionist/billing" }
];

export default async function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["RECEPTIONIST", "ADMIN", "NURSE"].includes(role)) redirect("/login");

  const pendingLabBillings = await prisma.labOrder.count({
    where: {
      invoice: { status: { in: ["UNPAID", "PARTIAL"] } }
    }
  });

  const badgeCounts: Record<string, number> = {};
  if (pendingLabBillings > 0) {
    badgeCounts["/receptionist/lab-billing"] = pendingLabBillings;
  }

  return (
    <DashboardShell role="Receptionist" userName={session.user.name} navItems={navItems} badgeCounts={badgeCounts}>
      {children}
    </DashboardShell>
  );
}
