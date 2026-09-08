import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, assignedToId } = body;

  const request = await prisma.maintenanceRequest.update({
    where: { id: params.id },
    data: {
      status,
      ...(assignedToId !== undefined ? { assignedToId } : {})
    },
    include: {
      reportedBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } }
    }
  });
  return NextResponse.json(request);
}
