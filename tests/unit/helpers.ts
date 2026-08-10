import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

export const db = new PrismaClient();

export async function resetDb() {
  await db.auditEvent.deleteMany();
  await db.approval.deleteMany();
  await db.changeRequest.deleteMany();
  await db.flagEnvironmentState.deleteMany();
  await db.featureFlag.deleteMany();
  await db.user.deleteMany();
}

export async function seedFixture() {
  const hash = hashSync("test-password", 4);
  const [developer, otherDeveloper, approver, auditor] = await Promise.all([
    db.user.create({ data: { name: "Dev One", email: "dev1@example.test", passwordHash: hash, role: "DEVELOPER" } }),
    db.user.create({ data: { name: "Dev Two", email: "dev2@example.test", passwordHash: hash, role: "DEVELOPER" } }),
    db.user.create({ data: { name: "Approver", email: "appr@example.test", passwordHash: hash, role: "RELEASE_APPROVER" } }),
    db.user.create({ data: { name: "Auditor", email: "audit@example.test", passwordHash: hash, role: "AUDITOR" } }),
  ]);

  const flag = await db.featureFlag.create({
    data: {
      key: "merchant_export_v2",
      name: "Merchant export v2",
      description: "Test flag",
      flagType: "BOOLEAN",
      states: {
        create: [
          { environment: "DEV", enabled: false, rolloutPercentage: 0 },
          { environment: "STAGING", enabled: false, rolloutPercentage: 0 },
          { environment: "PRODUCTION", enabled: false, rolloutPercentage: 0 },
        ],
      },
    },
  });

  return { developer, otherDeveloper, approver, auditor, flag };
}

export async function createDraft(requesterId: string, flagId: string) {
  return db.changeRequest.create({
    data: {
      flagId,
      environment: "STAGING",
      beforeEnabled: false,
      beforeRollout: 0,
      proposedEnabled: true,
      proposedRollout: 100,
      rationale: "Enable for staging validation.",
      requesterId,
    },
  });
}
