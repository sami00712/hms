import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { discharge } = await req.json();

  if (!discharge) {
    return NextResponse.json({ error: "Must set discharge: true" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUnique({
      where: { id },
      include: { bed: true, patient: true }
    });

    if (!admission || admission.dischargedAt) {
      return NextResponse.json({ error: "Admission not found or already discharged" }, { status: 400 });
    }

    const admittedAt = admission.admittedAt;
    const now = new Date();
    const daysAdmitted = Math.max(1, Math.ceil((now.getTime() - admittedAt.getTime()) / (1000 * 60 * 60 * 24)));

    const bedChargeRate = await tx.serviceRate.findFirst({
      where: { category: "BED_CHARGE_PER_DAY", active: true },
      orderBy: { price: "asc" }
    });

    if (!bedChargeRate) {
      return NextResponse.json({ error: "No bed charge rate configured" }, { status: 400 });
    }

    const totalAmount = bedChargeRate.price * daysAdmitted;

    await tx.invoice.create({
      data: {
        patientId: admission.patientId,
        totalAmount,
        paidAmount: 0,
        status: "UNPAID",
        sourceType: "ADMISSION",
        sourceId: admission.id
      }
    });

    await tx.bed.update({
      where: { id: admission.bedId },
      data: { status: "AVAILABLE" }
    });

    await tx.admission.update({
      where: { id },
      data: { dischargedAt: now }
    });

    return { admission, daysAdmitted, totalAmount, rateName: bedChargeRate.name };
  });

  if (result instanceof NextResponse) return result;

  return NextResponse.json(result);
}