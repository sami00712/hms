import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rates = await prisma.serviceRate.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(rates);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, category, price } = await req.json();
  if (!name || !category || price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rate = await prisma.serviceRate.create({
    data: { name, category, price: Number(price) }
  });

  return NextResponse.json(rate, { status: 201 });
}