import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const departments = ["OPD", "Gynae/Obs", "Cardiology", "Neurology", "Radiology/NICU", "Emergency"];
  for (const d of departments) {
    await prisma.department.upsert({ where: { name: d }, update: {}, create: { name: d } });
  }

  const users = [
    { name: "Admin User", email: "admin@hms.com", role: Role.ADMIN },
    { name: "Front Desk", email: "receptionist@hms.com", role: Role.RECEPTIONIST },
    { name: "Dr. Sarah Khan", email: "doctor@hms.com", role: Role.DOCTOR, specialty: "General Medicine" },
    { name: "Lab Technician", email: "lab@hms.com", role: Role.LAB },
    { name: "Pharmacist", email: "pharmacy@hms.com", role: Role.PHARMACIST }
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, password } });
  }

  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const opdDept = await prisma.department.findFirst({ where: { name: "OPD" } });
  if (admin && opdDept) {
    await prisma.user.update({ where: { id: admin.id }, data: { departmentId: opdDept.id } });
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
      { name: "OPD Consultation - General", category: "OPD_CONSULTATION", price: 1000 },
      { name: "Follow-up Visit", category: "FOLLOW_UP", price: 500 },
      { name: "General Ward Bed / day", category: "BED_CHARGE_PER_DAY", price: 2000 },
      { name: "ICU Bed / day", category: "BED_CHARGE_PER_DAY", price: 8000 }
    ],
    skipDuplicates: true
  });

  console.log("Seed complete. Default password for all accounts: Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
