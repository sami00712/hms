import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wards = await prisma.ward.findMany({
    include: {
      beds: {
        include: {
          admissions: {
            where: { dischargedAt: null },
            include: { patient: true }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(wards);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  const ward = await prisma.ward.create({
    data: { name }
  });

  return NextResponse.json(ward, { status: 201 });
}