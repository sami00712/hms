import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [patients, doctors, todayAppointments, unpaidInvoices, allMedicines, pendingLab] = await Promise.all([
    prisma.patient.count(),
    prisma.user.count({ where: { role: "DOCTOR" } }),
    prisma.appointment.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["UNPAID", "PARTIAL"] } },
      _sum: { totalAmount: true, paidAmount: true }
    }),
    prisma.medicine.findMany({ select: { stock: true, reorderLevel: true } }),
    prisma.labOrder.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } })
  ]);

  const lowStock = allMedicines.filter((m) => m.stock <= m.reorderLevel).length;

  // revenue by day for the last 14 days
  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true, totalAmount: true }
  });
  const revenueByDay: Record<string, number> = {};
  invoices.forEach((inv) => {
    const day = inv.createdAt.toISOString().slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] || 0) + inv.totalAmount;
  });

  const outstanding = (unpaidInvoices._sum.totalAmount || 0) - (unpaidInvoices._sum.paidAmount || 0);

  return NextResponse.json({
    patients,
    doctors,
    todayAppointments,
    outstanding,
    pendingLab,
    revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount }))
  });
}
