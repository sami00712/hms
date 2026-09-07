import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "RECEPTIONIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paidAmount = Number(body.paidAmount);
  const status = paidAmount >= invoice.totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: { paidAmount, status }
  });

  return NextResponse.json(updated);
}
