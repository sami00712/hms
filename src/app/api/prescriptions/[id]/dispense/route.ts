import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Marks a prescription as dispensed and deducts stock for each medicine item
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "PHARMACIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: { items: true, patient: true }
  });

  if (!prescription) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prescription.dispensed) return NextResponse.json({ error: "Already dispensed" }, { status: 400 });

  await prisma.$transaction([
    ...prescription.items.flatMap((it) => [
      prisma.medicine.update({
        where: { id: it.medicineId },
        data: { stock: { decrement: it.quantity } }
      }),
      prisma.inventoryTransaction.create({
        data: {
          medicineId: it.medicineId,
          type: "OUT",
          quantity: it.quantity,
          reason: `Dispensed - Rx ${params.id}`
        }
      })
    ]),
    prisma.prescription.update({
      where: { id: params.id },
      data: { dispensed: true, dispensedAt: new Date() }
    })
  ]);

  // Create a billing invoice for the dispensed medicines
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: prescription.items.map((i) => i.medicineId) } }
  });
  const priceMap = new Map(medicines.map((m) => [m.id, m.unitPrice]));

  const invoiceItems = prescription.items.map((it) => ({
    description: `Medicine - ${it.dosage}`,
    quantity: it.quantity,
    amount: (priceMap.get(it.medicineId) || 0) * it.quantity
  }));
  const totalAmount = invoiceItems.reduce((sum, i) => sum + i.amount, 0);

  await prisma.invoice.create({
    data: {
      patientId: prescription.patientId,
      totalAmount,
      status: "UNPAID",
      sourceType: "PRESCRIPTION",
      sourceId: prescription.id,
      items: { create: invoiceItems }
    }
  });

  return NextResponse.json({ success: true });
}
