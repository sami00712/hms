import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const departments = await prisma.department.findMany({
    include: { staff: { where: { role: "DOCTOR" as any }, select: { id: true, name: true, specialty: true } } }
  });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const dept = await prisma.department.create({ data: { name } });
    return NextResponse.json(dept);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
