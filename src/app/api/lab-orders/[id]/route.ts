import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "LAB"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const labOrder = await prisma.labOrder.findUnique({
    where: { id },
    include: { invoice: true }
  });

  if (!labOrder) {
    return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
  }

  if (body.status && body.status !== "CANCELLED") {
    if (!labOrder.invoice || labOrder.invoice.status !== "PAID") {
      return NextResponse.json({
        error: "This test has not been paid for yet. Please direct the patient to Reception for billing."
      }, { status: 400 });
    }
  }

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.result !== undefined) data.result = body.result;
  if (body.status === "COMPLETED") data.completedAt = new Date();

  const updated = await prisma.labOrder.update({
    where: { id },
    data,
    include: { doctor: true, patient: true, labTest: true }
  });

  if (body.status === "COMPLETED") {
    const [receptionist] = await prisma.user.findMany({
      where: { role: "RECEPTIONIST", active: true },
      select: { id: true }
    });

    const notificationPromises = [
      prisma.notification.create({
        data: {
          userId: updated.doctorId,
          title: "Lab Result Ready",
          message: `Result ready for ${updated.patient.name}'s lab test "${updated.labTest.name}".`
        }
      })
    ];

    if (receptionist) {
      notificationPromises.push(
        prisma.notification.create({
          data: {
            userId: receptionist.id,
            title: "Lab Result Ready",
            message: `Lab test result ready for ${updated.patient.name} — ${updated.labTest.name}.`
          }
        })
      );
    }

    await Promise.all(notificationPromises);
  }

  return NextResponse.json(updated);
}
