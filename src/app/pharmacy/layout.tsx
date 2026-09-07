import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const navItems = [
  { label: "Prescriptions to Dispense", href: "/pharmacy" },
  { label: "Inventory", href: "/pharmacy/inventory" }
];

export default async function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["PHARMACIST", "ADMIN"].includes(role)) redirect("/login");

  return (
    <DashboardShell role="Pharmacy" userName={session.user.name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
