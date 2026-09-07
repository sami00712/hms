import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const pendingOnly = req.nextUrl.searchParams.get("pending") === "true";

  const prescriptions = await prisma.prescription.findMany({
    where: pendingOnly ? { dispensed: false } : undefined,
    include: {
      patient: true,
      doctor: true,
      items: { include: { medicine: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json(prescriptions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const doctorId = (session?.user as any)?.id;
  if (!session || role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { patientId, appointmentId, notes, diagnosis, items } = body;

  if (!patientId || !items || !items.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId,
      appointmentId: appointmentId || undefined,
      notes,
      diagnosis,
      items: {
        create: items.map((it: any) => ({
          medicineId: it.medicineId,
          dosage: it.dosage,
          duration: it.duration,
          quantity: Number(it.quantity)
        }))
      }
    },
    include: { items: true }
  });

  if (appointmentId) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "COMPLETED" }
    });
  }

  return NextResponse.json(prescription);
}
