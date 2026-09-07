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
  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.result !== undefined) data.result = body.result;
  if (body.status === "COMPLETED") data.completedAt = new Date();

  const labOrder = await prisma.labOrder.update({
    where: { id },
    data,
    include: { doctor: true, patient: true }
  });

  if (body.status === "COMPLETED") {
    const [receptionist] = await prisma.user.findMany({
      where: { role: "RECEPTIONIST", active: true },
      select: { id: true }
    });

    const notificationPromises = [
      prisma.notification.create({
        data: {
          userId: labOrder.doctorId,
          title: "Lab Result Ready",
          message: `Result ready for ${labOrder.patient.name}'s lab test.`
        }
      })
    ];

    if (receptionist) {
      notificationPromises.push(
        prisma.notification.create({
          data: {
            userId: receptionist.id,
            title: "Lab Result Ready",
            message: `Lab test result ready for ${labOrder.patient.name}.`
          }
        })
      );
    }

    await Promise.all(notificationPromises);
  }

  return NextResponse.json(labOrder);
}