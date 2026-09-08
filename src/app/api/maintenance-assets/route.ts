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

  const assets = await prisma.maintenanceAsset.findMany({
    orderBy: [{ createdAt: "desc" as any }]
  });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, location, purchaseDate, notes } = body;
  if (!name || !category) return NextResponse.json({ error: "Name and category are required" }, { status: 400 });

  const asset = await prisma.maintenanceAsset.create({
    data: { name, category, location, purchaseDate, notes }
  });
  return NextResponse.json(asset);
}
