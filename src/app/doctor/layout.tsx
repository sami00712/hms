import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Today's Appointments", href: "/doctor" },
  { label: "OPD Queue", href: "/doctor/opd" }
];

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["DOCTOR", "ADMIN"].includes(role)) redirect("/login");

  return (
    <DashboardShell role="Doctor" userName={session.user.name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
