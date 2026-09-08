import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.maintenanceRequest.count({
    where: { status: { in: ["REPORTED", "SCHEDULED"] } }
  });

  return NextResponse.json({ count });
}
