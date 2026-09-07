import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");

  const patients = await prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { mrNumber: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, gender, dob, phone, address, bloodGroup } = body;

  if (!name || !gender || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const count = await prisma.patient.count();
  const mrNumber = `MR-${String(count + 1).padStart(5, "0")}`;

  const patient = await prisma.patient.create({
    data: {
      mrNumber,
      name,
      gender,
      dob: dob ? new Date(dob) : undefined,
      phone,
      address,
      bloodGroup
    }
  });

  return NextResponse.json(patient);
}
