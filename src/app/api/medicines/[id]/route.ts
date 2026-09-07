import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "PHARMACIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Stock adjustment: body.adjustQuantity (+/-) with reason, logged as InventoryTransaction
  if (body.adjustQuantity != null) {
    const qty = Number(body.adjustQuantity);
    const medicine = await prisma.medicine.update({
      where: { id: params.id },
      data: { stock: { increment: qty } }
    });
    await prisma.inventoryTransaction.create({
      data: {
        medicineId: params.id,
        type: qty >= 0 ? "IN" : "OUT",
        quantity: Math.abs(qty),
        reason: body.reason || "Manual adjustment"
      }
    });
    return NextResponse.json(medicine);
  }

  const medicine = await prisma.medicine.update({
    where: { id: params.id },
    data: {
      name: body.name,
      category: body.category,
      unitPrice: body.unitPrice != null ? Number(body.unitPrice) : undefined,
      reorderLevel: body.reorderLevel != null ? Number(body.reorderLevel) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined
    }
  });
  return NextResponse.json(medicine);
}
