import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Dashboard", href: "/receptionist" },
  { label: "Patients", href: "/receptionist/patients" },
  { label: "Appointments", href: "/receptionist/appointments" },
  { label: "OPD Token", href: "/receptionist/opd" },
  { label: "Admissions", href: "/receptionist/admissions" },
  { label: "Lab Reports", href: "/receptionist/lab-reports" },
  { label: "Billing", href: "/receptionist/billing" }
];

export default async function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["RECEPTIONIST", "ADMIN"].includes(role)) redirect("/login");

  return (
    <DashboardShell role="Receptionist" userName={session.user.name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
