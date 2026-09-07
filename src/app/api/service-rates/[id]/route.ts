import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { name, category, price, active } = await req.json();

  const rate = await prisma.serviceRate.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(category && { category }),
      ...(price != null && { price: Number(price) }),
      ...(active != null && { active })
    }
  });

  return NextResponse.json(rate);
}