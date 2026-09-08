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

  const status = req.nextUrl.searchParams.get("status");
  const category = req.nextUrl.searchParams.get("category");
  const priority = req.nextUrl.searchParams.get("priority");
  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, category: true } },
      reportedBy: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } }
    },
    orderBy: [{ priority: "asc" as any }, { reportedAt: "desc" as any }]
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { assetId, customLocation, category, customCategory, title, description, priority } = body;
  if (!category || !title) return NextResponse.json({ error: "Category and title are required" }, { status: 400 });
  if (category === "OTHER" && !customCategory) {
    return NextResponse.json({ error: "Custom category is required when category is OTHER" }, { status: 400 });
  }

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: assetId || null,
      customLocation: customLocation || null,
      category,
      customCategory: customCategory || null,
      title,
      description,
      priority: priority || "NORMAL",
      reportedById: session.user.id
    },
    include: {
      reportedBy: { select: { id: true, name: true } }
    }
  });
  return NextResponse.json(request);
}
