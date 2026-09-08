import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "LAB"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.name !== undefined) data.name = body.name;

  const test = await prisma.labTest.update({
    where: { id: params.id },
    data
  });
  return NextResponse.json(test);
}
