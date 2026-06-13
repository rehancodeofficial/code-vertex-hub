import { PrismaClient, type Prisma } from "@prisma/client";
import { config } from "../src/config.js";
import { hashPassword } from "../src/utils/crypto.js";

const prisma = new PrismaClient();

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  const passwordHash = await hashPassword(config.DEFAULT_EMPLOYEE_PASSWORD || "ChangeMe@Prod1");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Company Settings (idempotent)
    await tx.companySettings.upsert({
      where: { id: "company" },
      update: {},
      create: { id: "company" },
    });

    // 2. Admin Employee — upsert by unique email, no hardcoded UUID
    //    Use createOrUpdate pattern: find first, then upsert by email unique constraint.
    const adminEmail = "admin@codevertex.io";

    const existingAdmin = await tx.employee.findUnique({ where: { email: adminEmail } });

    const adminData = {
      employeeCode: "CVS-000",
      fullName: "Admin Vertex",
      email: adminEmail,
      phone: "+92 300 0000000",
      cnic: "00000-0000000-0",
      address: "CodeVertex Head Office, Karachi",
      gender: "other" as const,
      dob: date("1990-01-01"),
      designation: "System Administrator",
      joiningDate: date("2022-01-01"),
      status: "active" as const,
      salary: "1000000",
      role: "admin" as const,
    };

    let adminEmployee: { id: string };

    if (existingAdmin) {
      adminEmployee = await tx.employee.update({
        where: { email: adminEmail },
        data: adminData,
      });
    } else {
      adminEmployee = await tx.employee.create({ data: adminData });
    }

    // 3. Admin Credentials (upsert by employeeId)
    await tx.userCredential.upsert({
      where: { employeeId: adminEmployee.id },
      update: { passwordHash, emailVerifiedAt: new Date(), disabledAt: null },
      create: {
        employeeId: adminEmployee.id,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    // 4. Admin Notification Preferences (upsert)
    await tx.notificationPreference.upsert({
      where: { employeeId: adminEmployee.id },
      update: {},
      create: { employeeId: adminEmployee.id },
    });

    // 5. Audit Log for Seeding
    await tx.auditLog.create({
      data: {
        actorId: adminEmployee.id,
        actorName: adminData.fullName,
        action: "seed.database",
        target: "system",
        metadata: { source: "server/prisma/seed.ts" },
      },
    });
  });

  console.log(`✅ Seed completed.`);
  console.log(`   Admin login: admin@codevertex.io`);
  console.log(`   Password:    ${config.DEFAULT_EMPLOYEE_PASSWORD || "ChangeMe@Prod1"}`);
  console.log(`   ⚠️  Change the admin password immediately after first login in production.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
