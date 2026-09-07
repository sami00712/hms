import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pendingOnly = req.nextUrl.searchParams.get("pending") === "true";
  const statusFilter = req.nextUrl.searchParams.get("status");

  const labOrders = await prisma.labOrder.findMany({
    where: pendingOnly ? { status: { in: ["PENDING", "IN_PROGRESS"] } } : statusFilter ? { status: statusFilter as any } : undefined,
    include: { patient: true, doctor: true, labTest: true },
    orderBy: { orderedAt: "desc" },
    take: 100
  });

  return NextResponse.json(labOrders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const doctorId = (session?.user as any)?.id;
  if (!session || role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { patientId, labTestId } = body;

  if (!patientId || !labTestId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const labOrder = await prisma.labOrder.create({
    data: { patientId, doctorId, labTestId },
    include: { labTest: true }
  });

  // Auto-generate billing invoice for the lab test
  await prisma.invoice.create({
    data: {
      patientId,
      totalAmount: labOrder.labTest.price,
      status: "UNPAID",
      sourceType: "LAB",
      sourceId: labOrder.id,
      items: {
        create: [{ description: `Lab Test - ${labOrder.labTest.name}`, quantity: 1, amount: labOrder.labTest.price }]
      }
    }
  });

  // Send notifications to doctor and receptionist
  const [receptionist] = await prisma.user.findMany({
    where: { role: "RECEPTIONIST", active: true },
    select: { id: true }
  });

  const notificationPromises = [
    prisma.notification.create({
      data: {
        userId: doctorId,
        title: "Lab Test Ordered",
        message: `Lab test "${labOrder.labTest.name}" ordered for patient.`
      }
    })
  ];

  if (receptionist) {
    notificationPromises.push(
      prisma.notification.create({
        data: {
          userId: receptionist.id,
          title: "New Lab Order",
          message: `New lab test ordered for patient by Dr. ${session.user.name}.`
        }
      })
    );
  }

  await Promise.all(notificationPromises);

  return NextResponse.json(labOrder);
}