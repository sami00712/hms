import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  const year = req.nextUrl.searchParams.get("year");
  const where: any = {};
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);

  const records = await prisma.salaryRecord.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true, department: { select: { name: true } } } }
    },
    orderBy: [{ createdAt: "desc" as any }]
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, month, year, baseSalary, bonus, deductions } = body;
  if (!userId || !month || !year || baseSalary === undefined) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const netPay = baseSalary + (bonus || 0) - (deductions || 0);

  try {
    const record = await prisma.salaryRecord.create({
      data: { userId, month, year, baseSalary, bonus: bonus || 0, deductions: deductions || 0, netPay },
      include: { user: { select: { id: true, name: true, role: true } } }
    });
    return NextResponse.json(record);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Salary record already exists for this month/year" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create salary record" }, { status: 500 });
  }
}
