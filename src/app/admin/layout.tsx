import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users & Staff", href: "/admin/users" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Service Rates", href: "/admin/rates" },
  { label: "Wards & Beds", href: "/admin/wards" },
  { label: "Doctor Availability", href: "/admin/doctor-availability" },
  { label: "Patients", href: "/receptionist/patients" },
  { label: "Appointments", href: "/receptionist/appointments" },
  { label: "Medicines / Inventory", href: "/pharmacy" },
  { label: "Lab Orders", href: "/lab" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <DashboardShell role="Admin" userName={session.user.name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
