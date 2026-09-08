import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users & Staff", href: "/admin/users" },
  { label: "Departments", href: "/admin/departments" },
  { label: "Nurses", href: "/admin/nurses" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Maintenance", href: "/admin/maintenance" },
  { label: "Maintenance Assets", href: "/admin/maintenance/assets" },
  { label: "Payroll", href: "/admin/payroll" },
  { label: "Service Rates", href: "/admin/rates" },
  { label: "Lab Tests", href: "/admin/lab-tests" },
  { label: "Wards & Beds", href: "/admin/wards" },
  { label: "Doctor Availability", href: "/admin/doctor-availability" },
  { label: "Patients", href: "/admin/patients" },
  { label: "Appointments", href: "/admin/appointments" },
  { label: "Medicines / Inventory", href: "/pharmacy" },
  { label: "Lab Orders", href: "/lab" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const pendingMaintenance = await prisma.maintenanceRequest.count({
    where: { status: { in: ["REPORTED", "SCHEDULED"] } }
  });

  const badgeCounts: Record<string, number> = {};
  if (pendingMaintenance > 0) {
    badgeCounts["/admin/maintenance"] = pendingMaintenance;
  }

  return (
    <DashboardShell role="Admin" userName={session.user.name} navItems={navItems} badgeCounts={badgeCounts}>
      {children}
    </DashboardShell>
  );
}
