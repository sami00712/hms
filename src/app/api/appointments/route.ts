import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const dateParam = req.nextUrl.searchParams.get("date");

  const where: any = {};
  if (role === "DOCTOR") where.doctorId = userId;
  if (dateParam) {
    const start = new Date(dateParam);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateParam);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true, doctor: true },
    orderBy: { date: "asc" }
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "RECEPTIONIST"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { patientId, doctorId, date, reason } = body;

  if (!patientId || !doctorId || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: { patientId, doctorId, date: new Date(date), reason },
    include: { patient: true, doctor: true }
  });

  await prisma.notification.create({
    data: {
      userId: doctorId,
      title: "New Appointment",
      message: `New appointment scheduled with ${appointment.patient.name} on ${new Date(date).toLocaleString()}`
    }
  });

  return NextResponse.json(appointment);
}
