import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctor: { active: true } },
    include: { doctor: { select: { id: true, name: true, specialty: true } } },
    orderBy: [{ doctor: { name: "asc" } }, { day: "asc" }, { startTime: "asc" }]
  });

  return NextResponse.json(availabilities);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { doctorId, day, startTime, endTime } = await req.json();
  if (!doctorId || !day || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const availability = await prisma.doctorAvailability.create({
    data: { doctorId, day, startTime: new Date(startTime), endTime: new Date(endTime) },
    include: { doctor: { select: { id: true, name: true, specialty: true } } }
  });

  return NextResponse.json(availability, { status: 201 });
}