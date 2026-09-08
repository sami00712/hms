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

  const nurses = await prisma.nurse.findMany({
    include: { department: { select: { id: true, name: true } } }
  });
  return NextResponse.json(nurses);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, departmentId } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const nurse = await prisma.nurse.create({ data: { name, phone, departmentId } });
  return NextResponse.json(nurse);
}
