import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pendingOnly = req.nextUrl.searchParams.get("pending") === "true";
  const statusFilter = req.nextUrl.searchParams.get("status");
  const includeInvoice = req.nextUrl.searchParams.get("includeInvoice") === "true";

  const labOrders = await prisma.labOrder.findMany({
    where: pendingOnly ? { status: { in: ["PENDING", "IN_PROGRESS"] } } : statusFilter ? { status: statusFilter as any } : undefined,
    include: {
      patient: true,
      doctor: true,
      labTest: true,
      ...(includeInvoice ? { invoice: { include: { items: true } } } : {})
    },
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

  const labTest = await prisma.labTest.findUnique({ where: { id: labTestId } });
  if (!labTest) {
    return NextResponse.json({ error: "Lab test not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        patientId,
        totalAmount: labTest.price,
        status: "UNPAID",
        sourceType: "LAB",
        items: {
          create: [{ description: `Lab Test - ${labTest.name}`, quantity: 1, amount: labTest.price }]
        }
      }
    });

    const labOrder = await tx.labOrder.create({
      data: { patientId, doctorId, labTestId, invoiceId: invoice.id },
      include: { labTest: true, invoice: true }
    });

    return labOrder;
  });

  const [receptionist] = await prisma.user.findMany({
    where: { role: "RECEPTIONIST", active: true },
    select: { id: true }
  });

  const notificationPromises = [
    prisma.notification.create({
      data: {
        userId: doctorId,
        title: "Lab Test Ordered",
        message: `Lab test "${result.labTest.name}" ordered for patient.`
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

  return NextResponse.json(result);
}
