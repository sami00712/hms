import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getTodayTokenBase(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const max = await prisma.oPDVisit.aggregate({
    _max: { tokenNumber: true },
    where: { visitDate: { gte: today, lt: tomorrow } }
  });

  return (max._max.tokenNumber ?? 0) + 1;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const visits = await prisma.oPDVisit.findMany({
    where: { visitDate: { gte: today, lt: tomorrow } },
    include: {
      patient: { select: { id: true, name: true, mrNumber: true } },
      doctor: { select: { id: true, name: true } },
      serviceRate: { select: { id: true, name: true, price: true } }
    },
    orderBy: { tokenNumber: "asc" }
  });

  return NextResponse.json(visits);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId, serviceRateId, doctorId } = await req.json();
  if (!patientId || !serviceRateId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tokenNumber = await getTodayTokenBase();

  const opdVisit = await prisma.$transaction(async (tx) => {
    const visit = await tx.oPDVisit.create({
      data: {
        tokenNumber,
        patientId,
        doctorId: doctorId || null,
        serviceRateId,
        status: "WAITING"
      }
    });

    const rate = await tx.serviceRate.findUnique({ where: { id: serviceRateId } });
    if (!rate) throw new Error("Service rate not found");

    await tx.invoice.create({
      data: {
        patientId,
        totalAmount: rate.price,
        paidAmount: 0,
        status: "UNPAID",
        sourceType: "OPD",
        sourceId: visit.id
      },
      include: { items: true }
    });

    return visit;
  });

  const result = await prisma.oPDVisit.findUnique({
    where: { id: opdVisit.id },
    include: {
      patient: { select: { id: true, name: true, mrNumber: true } },
      doctor: { select: { id: true, name: true } },
      serviceRate: { select: { id: true, name: true, price: true } }
    }
  });

  return NextResponse.json(result, { status: 201 });
}