import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const visit = await prisma.oPDVisit.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, mrNumber: true } },
      doctor: { select: { id: true, name: true } },
      serviceRate: { select: { id: true, name: true, price: true } }
    }
  });

  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(visit);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, doctorId } = await req.json();

  const data: Record<string, any> = {};
  if (status) data.status = status;
  if (doctorId !== undefined) data.doctorId = doctorId;

  const visit = await prisma.oPDVisit.update({
    where: { id },
    data
  });

  return NextResponse.json(visit);
}