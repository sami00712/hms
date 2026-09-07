import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const medicines = await prisma.medicine.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(medicines);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "PHARMACIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, category, unit, unitPrice, stock, reorderLevel, expiryDate } = body;

  if (!name || unitPrice == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const medicine = await prisma.medicine.create({
    data: {
      name,
      category,
      unit: unit || "tablet",
      unitPrice: Number(unitPrice),
      stock: Number(stock) || 0,
      reorderLevel: Number(reorderLevel) || 10,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    }
  });

  if (medicine.stock > 0) {
    await prisma.inventoryTransaction.create({
      data: { medicineId: medicine.id, type: "IN", quantity: medicine.stock, reason: "Initial stock" }
    });
  }

  return NextResponse.json(medicine);
}
