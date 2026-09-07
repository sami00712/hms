import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admissions = await prisma.admission.findMany({
    where: { dischargedAt: null },
    include: {
      patient: { select: { id: true, name: true, mrNumber: true } },
      bed: { include: { ward: true } },
      doctor: { select: { id: true, name: true } }
    },
    orderBy: { admittedAt: "desc" }
  });

  return NextResponse.json(admissions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId, bedId, doctorId } = await req.json();
  if (!patientId || !bedId || !doctorId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed || bed.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Bed not available" }, { status: 400 });
  }

  const admission = await prisma.$transaction(async (tx) => {
    await tx.bed.update({ where: { id: bedId }, data: { status: "OCCUPIED" } });

    const adm = await tx.admission.create({
      data: { patientId, bedId, doctorId }
    });

    return adm;
  });

  return NextResponse.json(admission, { status: 201 });
}