import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const beds = await prisma.bed.findMany({
    include: {
      ward: true,
      admissions: {
        where: { dischargedAt: null },
        include: { patient: true }
      }
    },
    orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }]
  });

  return NextResponse.json(beds);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { wardId, bedNumber } = await req.json();
  if (!wardId || !bedNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bed = await prisma.bed.create({
    data: { wardId, bedNumber: String(bedNumber) }
  });

  return NextResponse.json(bed, { status: 201 });
}