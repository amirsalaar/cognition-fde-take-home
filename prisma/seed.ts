import { PrismaClient, VirtualEnvironment } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

// Synthetic demo accounts. Documented in README. Fictional people and flags only.
const PASSWORD = "demo-password-123";

async function main() {
  const hash = hashSync(PASSWORD, 10);

  const [dana, devon, rae, riley] = await Promise.all([
    prisma.user.upsert({
      where: { email: "dana.dev@example.test" },
      update: {},
      create: { name: "Dana Iwu", email: "dana.dev@example.test", passwordHash: hash, role: "DEVELOPER" },
    }),
    prisma.user.upsert({
      where: { email: "devon.dev@example.test" },
      update: {},
      create: { name: "Devon Marsh", email: "devon.dev@example.test", passwordHash: hash, role: "DEVELOPER" },
    }),
    prisma.user.upsert({
      where: { email: "rae.approver@example.test" },
      update: {},
      create: { name: "Rae Calder", email: "rae.approver@example.test", passwordHash: hash, role: "RELEASE_APPROVER" },
    }),
    prisma.user.upsert({
      where: { email: "riley.approver@example.test" },
      update: {},
      create: { name: "Riley Osei", email: "riley.approver@example.test", passwordHash: hash, role: "RELEASE_APPROVER" },
    }),
    prisma.user.upsert({
      where: { email: "ada.auditor@example.test" },
      update: {},
      create: { name: "Ada Reyes", email: "ada.auditor@example.test", passwordHash: hash, role: "AUDITOR" },
    }),
  ]);

  const flagDefs = [
    { key: "merchant_export_v2", name: "Merchant export v2", description: "New CSV export pipeline for merchant statements.", flagType: "BOOLEAN" as const },
    { key: "manual_review_assist", name: "Manual review assist", description: "Inline hints for reviewers in the manual queue.", flagType: "BOOLEAN" as const },
    { key: "statement_search_beta", name: "Statement search beta", description: "Percentage rollout of the new statement search.", flagType: "PERCENTAGE_ROLLOUT" as const },
    { key: "dashboard_dark_mode", name: "Dashboard dark mode", description: "Dark theme for the internal dashboard.", flagType: "BOOLEAN" as const },
    { key: "batch_export_throttle", name: "Batch export throttle", description: "Gradual rollout of throttled batch exports.", flagType: "PERCENTAGE_ROLLOUT" as const },
  ];

  const flags = [] as { id: string; key: string }[];
  for (const def of flagDefs) {
    const flag = await prisma.featureFlag.upsert({
      where: { key: def.key },
      update: {},
      create: def,
    });
    flags.push({ id: flag.id, key: flag.key });
    for (const environment of Object.values(VirtualEnvironment)) {
      await prisma.flagEnvironmentState.upsert({
        where: { flagId_environment: { flagId: flag.id, environment } },
        update: {},
        create: {
          flagId: flag.id,
          environment,
          enabled: environment === "DEV",
          rolloutPercentage: environment === "DEV" ? 100 : 0,
        },
      });
    }
  }

  const existing = await prisma.changeRequest.count();
  if (existing > 0) return;

  const byKey = (key: string) => {
    const found = flags.find((f) => f.key === key);
    if (!found) throw new Error(`Missing seeded flag ${key}`);
    return found.id;
  };

  // One request per status so every state appears in the console.
  const draft = await prisma.changeRequest.create({
    data: {
      flagId: byKey("dashboard_dark_mode"),
      environment: "STAGING",
      beforeEnabled: false,
      beforeRollout: 0,
      proposedEnabled: true,
      proposedRollout: 100,
      rationale: "Enable dark mode in staging for design review.",
      status: "DRAFT",
      requesterId: devon.id,
    },
  });
  await prisma.auditEvent.create({
    data: {
      actorId: devon.id,
      action: "CREATE",
      changeRequestId: draft.id,
      before: {},
      after: { status: "DRAFT" },
    },
  });

  const pending = await prisma.changeRequest.create({
    data: {
      flagId: byKey("merchant_export_v2"),
      environment: "STAGING",
      beforeEnabled: false,
      beforeRollout: 0,
      proposedEnabled: true,
      proposedRollout: 100,
      rationale: "Staging validation before the export cutover.",
      status: "PENDING_APPROVAL",
      requesterId: dana.id,
    },
  });
  await prisma.auditEvent.createMany({
    data: [
      { actorId: dana.id, action: "CREATE", changeRequestId: pending.id, before: {}, after: { status: "DRAFT" } },
      { actorId: dana.id, action: "SUBMIT", changeRequestId: pending.id, before: { status: "DRAFT" }, after: { status: "PENDING_APPROVAL" } },
    ],
  });

  const approved = await prisma.changeRequest.create({
    data: {
      flagId: byKey("statement_search_beta"),
      environment: "PRODUCTION",
      beforeEnabled: false,
      beforeRollout: 0,
      proposedEnabled: true,
      proposedRollout: 10,
      rationale: "Start 10 percent production rollout of statement search.",
      status: "APPROVED",
      requesterId: dana.id,
      approverId: rae.id,
      decisionRationale: "Staging metrics look healthy.",
      version: 3,
    },
  });
  await prisma.approval.create({
    data: { changeRequestId: approved.id, approverId: rae.id, decision: "APPROVE", rationale: "Staging metrics look healthy." },
  });
  await prisma.auditEvent.createMany({
    data: [
      { actorId: dana.id, action: "CREATE", changeRequestId: approved.id, before: {}, after: { status: "DRAFT" } },
      { actorId: dana.id, action: "SUBMIT", changeRequestId: approved.id, before: { status: "DRAFT" }, after: { status: "PENDING_APPROVAL" } },
      { actorId: rae.id, action: "APPROVE", changeRequestId: approved.id, before: { status: "PENDING_APPROVAL" }, after: { status: "APPROVED" } },
    ],
  });

  const rejected = await prisma.changeRequest.create({
    data: {
      flagId: byKey("batch_export_throttle"),
      environment: "PRODUCTION",
      beforeEnabled: false,
      beforeRollout: 0,
      proposedEnabled: true,
      proposedRollout: 50,
      rationale: "Jump throttle rollout to 50 percent.",
      status: "REJECTED",
      requesterId: devon.id,
      approverId: riley.id,
      decisionRationale: "Too large a jump. Propose 10 percent first.",
      version: 3,
    },
  });
  await prisma.approval.create({
    data: { changeRequestId: rejected.id, approverId: riley.id, decision: "REJECT", rationale: "Too large a jump. Propose 10 percent first." },
  });
  await prisma.auditEvent.createMany({
    data: [
      { actorId: devon.id, action: "CREATE", changeRequestId: rejected.id, before: {}, after: { status: "DRAFT" } },
      { actorId: devon.id, action: "SUBMIT", changeRequestId: rejected.id, before: { status: "DRAFT" }, after: { status: "PENDING_APPROVAL" } },
      { actorId: riley.id, action: "REJECT", changeRequestId: rejected.id, before: { status: "PENDING_APPROVAL" }, after: { status: "REJECTED" } },
    ],
  });

  const applied = await prisma.changeRequest.create({
    data: {
      flagId: byKey("manual_review_assist"),
      environment: "STAGING",
      beforeEnabled: false,
      beforeRollout: 0,
      proposedEnabled: true,
      proposedRollout: 100,
      rationale: "Turn on review assist in staging for the ops pilot.",
      status: "APPLIED",
      requesterId: dana.id,
      approverId: riley.id,
      decisionRationale: "Pilot approved by ops lead.",
      version: 4,
    },
  });
  await prisma.approval.create({
    data: { changeRequestId: applied.id, approverId: riley.id, decision: "APPROVE", rationale: "Pilot approved by ops lead." },
  });
  await prisma.flagEnvironmentState.updateMany({
    where: { flagId: byKey("manual_review_assist"), environment: "STAGING" },
    data: { enabled: true, rolloutPercentage: 100, providerVersion: 2 },
  });
  await prisma.auditEvent.createMany({
    data: [
      { actorId: dana.id, action: "CREATE", changeRequestId: applied.id, before: {}, after: { status: "DRAFT" } },
      { actorId: dana.id, action: "SUBMIT", changeRequestId: applied.id, before: { status: "DRAFT" }, after: { status: "PENDING_APPROVAL" } },
      { actorId: riley.id, action: "APPROVE", changeRequestId: applied.id, before: { status: "PENDING_APPROVAL" }, after: { status: "APPROVED" } },
      { actorId: riley.id, action: "APPLY", changeRequestId: applied.id, before: { status: "APPROVED", flag: { enabled: false, rolloutPercentage: 0 } }, after: { status: "APPLIED", flag: { enabled: true, rolloutPercentage: 100 } } },
    ],
  });

  const rolledBack = await prisma.changeRequest.create({
    data: {
      flagId: byKey("merchant_export_v2"),
      environment: "DEV",
      beforeEnabled: true,
      beforeRollout: 100,
      proposedEnabled: false,
      proposedRollout: 0,
      rationale: "Disable export v2 in dev while debugging encoding issue.",
      status: "ROLLED_BACK",
      requesterId: devon.id,
      approverId: rae.id,
      decisionRationale: "Approved for debugging window.",
      version: 5,
    },
  });
  await prisma.approval.create({
    data: { changeRequestId: rolledBack.id, approverId: rae.id, decision: "APPROVE", rationale: "Approved for debugging window." },
  });
  await prisma.auditEvent.createMany({
    data: [
      { actorId: devon.id, action: "CREATE", changeRequestId: rolledBack.id, before: {}, after: { status: "DRAFT" } },
      { actorId: devon.id, action: "SUBMIT", changeRequestId: rolledBack.id, before: { status: "DRAFT" }, after: { status: "PENDING_APPROVAL" } },
      { actorId: rae.id, action: "APPROVE", changeRequestId: rolledBack.id, before: { status: "PENDING_APPROVAL" }, after: { status: "APPROVED" } },
      { actorId: rae.id, action: "APPLY", changeRequestId: rolledBack.id, before: { status: "APPROVED", flag: { enabled: true, rolloutPercentage: 100 } }, after: { status: "APPLIED", flag: { enabled: false, rolloutPercentage: 0 } } },
      { actorId: rae.id, action: "ROLLBACK", changeRequestId: rolledBack.id, before: { status: "APPLIED", flag: { enabled: false, rolloutPercentage: 0 } }, after: { status: "ROLLED_BACK", flag: { enabled: true, rolloutPercentage: 100 } } },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
