import { PrismaClient, Role, ServiceCategory, BedStatus, WeekDay } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const users = [
    { name: "Admin User", email: "admin@hms.com", role: Role.ADMIN },
    { name: "Front Desk", email: "receptionist@hms.com", role: Role.RECEPTIONIST },
    { name: "Dr. Sarah Khan", email: "doctor@hms.com", role: Role.DOCTOR, specialty: "General Medicine" },
    { name: "Lab Technician", email: "lab@hms.com", role: Role.LAB },
    { name: "Pharmacist", email: "pharmacy@hms.com", role: Role.PHARMACIST }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password }
    });
  }

  await prisma.labTest.createMany({
    data: [
      { name: "Complete Blood Count (CBC)", price: 500 },
      { name: "Blood Sugar (Fasting)", price: 300 },
      { name: "Liver Function Test", price: 1200 },
      { name: "Urine Routine", price: 250 }
    ],
    skipDuplicates: true
  });

  await prisma.medicine.createMany({
    data: [
      { name: "Paracetamol 500mg", category: "Analgesic", unit: "tablet", unitPrice: 2, stock: 500, reorderLevel: 50 },
      { name: "Amoxicillin 250mg", category: "Antibiotic", unit: "capsule", unitPrice: 8, stock: 200, reorderLevel: 30 },
      { name: "Omeprazole 20mg", category: "Antacid", unit: "capsule", unitPrice: 5, stock: 150, reorderLevel: 20 },
      { name: "Cetirizine 10mg", category: "Antihistamine", unit: "tablet", unitPrice: 3, stock: 300, reorderLevel: 40 }
    ],
    skipDuplicates: true
  });

  await prisma.serviceRate.createMany({
    data: [
      { name: "OPD Consultation - General", category: ServiceCategory.OPD_CONSULTATION, price: 1000 },
      { name: "Follow-up Visit", category: ServiceCategory.FOLLOW_UP, price: 500 },
      { name: "General Ward Bed / day", category: ServiceCategory.BED_CHARGE_PER_DAY, price: 2000 },
      { name: "ICU Bed / day", category: ServiceCategory.BED_CHARGE_PER_DAY, price: 8000 }
    ],
    skipDuplicates: true
  });

  const generalWard = await prisma.ward.findFirst({ where: { name: "General Ward" } })
    ?? await prisma.ward.create({ data: { name: "General Ward" } });
  const icuWard = await prisma.ward.findFirst({ where: { name: "ICU" } })
    ?? await prisma.ward.create({ data: { name: "ICU" } });
  const maternityWard = await prisma.ward.findFirst({ where: { name: "Maternity" } })
    ?? await prisma.ward.create({ data: { name: "Maternity" } });

  for (let i = 1; i <= 10; i++) {
    await prisma.bed.upsert({
      where: { wardId_bedNumber: { wardId: generalWard.id, bedNumber: String(i) } },
      update: {},
      create: { wardId: generalWard.id, bedNumber: String(i), status: BedStatus.AVAILABLE }
    });
  }
  for (let i = 1; i <= 4; i++) {
    await prisma.bed.upsert({
      where: { wardId_bedNumber: { wardId: icuWard.id, bedNumber: String(i) } },
      update: {},
      create: { wardId: icuWard.id, bedNumber: String(i), status: BedStatus.AVAILABLE }
    });
  }
  for (let i = 1; i <= 6; i++) {
    await prisma.bed.upsert({
      where: { wardId_bedNumber: { wardId: maternityWard.id, bedNumber: String(i) } },
      update: {},
      create: { wardId: maternityWard.id, bedNumber: String(i), status: BedStatus.AVAILABLE }
    });
  }

  // Seed doctor availability
  const doctor = await prisma.user.findFirst({ where: { role: Role.DOCTOR } });
  if (doctor) {
    const days = [WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY];
    for (const day of days) {
      const existing = await prisma.doctorAvailability.findFirst({
        where: { doctorId: doctor.id, day }
      });
      if (!existing) {
        await prisma.doctorAvailability.create({
          data: { doctorId: doctor.id, day, startTime: new Date("2026-09-07T09:00:00"), endTime: new Date("2026-09-07T17:00:00"), isAvailable: true }
        });
      }
    }
  }

  console.log("Seed complete. Default password for all accounts: Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });