import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  const statusFilter = req.nextUrl.searchParams.get("status");

  if (id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { patient: true, items: true }
    });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  }

  const invoices = await prisma.invoice.findMany({
    where: statusFilter ? { status: statusFilter as any } : undefined,
    include: { patient: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "RECEPTIONIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { patientId, items, sourceType, sourceId } = body;

  if (!patientId || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const totalAmount = items.reduce((sum: number, i: any) => sum + Number(i.amount) * Number(i.quantity || 1), 0);

  const invoice = await prisma.invoice.create({
    data: {
      patientId,
      totalAmount,
      paidAmount: 0,
      status: "UNPAID",
      sourceType,
      sourceId,
      items: { create: items.map((i: any) => ({ description: i.description, quantity: Number(i.quantity) || 1, amount: Number(i.amount) })) }
    },
    include: { items: true, patient: true }
  });

  return NextResponse.json(invoice);
}
