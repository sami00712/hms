import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = req.nextUrl.searchParams.get("resolved");
  const where: any = {};
  if (resolved === "false") where.resolved = false;

  const alerts = await prisma.issueAlert.findMany({
    where,
    include: {
      department: { select: { id: true, name: true } },
      raisedBy: { select: { id: true, name: true, role: true } }
    },
    orderBy: [{ priority: "asc" as any }, { createdAt: "desc" as any }]
  });
  return NextResponse.json(alerts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { departmentId, title, description, priority } = body;
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const alert = await prisma.issueAlert.create({
    data: { departmentId: departmentId || null, title, description, priority: priority || "NORMAL", raisedById: session.user.id },
    include: {
      department: { select: { id: true, name: true } },
      raisedBy: { select: { id: true, name: true } }
    }
  });
  return NextResponse.json(alert);
}
