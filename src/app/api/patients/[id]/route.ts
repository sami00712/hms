import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { id } = await params;

  // Doctors can only see patients they have an active OPD visit with
  if (role === "DOCTOR") {
    const hasAccess = await prisma.oPDVisit.findFirst({
      where: {
        patientId: id,
        doctorId: session.user.id,
        status: { in: ["WAITING", "IN_CONSULTATION"] }
      }
    });
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: You can only access your own OPD patients" }, { status: 403 });
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { date: "desc" }, include: { doctor: true } },
      prescriptions: { orderBy: { createdAt: "desc" }, include: { items: { include: { medicine: true } }, doctor: true } },
      labOrders: { orderBy: { orderedAt: "desc" }, include: { labTest: true } },
      invoices: { orderBy: { createdAt: "desc" } },
      opdVisits: { orderBy: { visitDate: "desc" }, include: { doctor: true, serviceRate: true } },
      admissions: { orderBy: { admittedAt: "desc" }, include: { bed: { include: { ward: true } }, doctor: true } }
    }
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "RECEPTIONIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const patient = await prisma.patient.update({
    where: { id },
    data: {
      name: body.name,
      gender: body.gender,
      phone: body.phone,
      address: body.address,
      bloodGroup: body.bloodGroup
    }
  });
  return NextResponse.json(patient);
}
