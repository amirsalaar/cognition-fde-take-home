import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { authorize } from "@/domain/policy";
import { guardTransition } from "@/domain/transitions";
import { FakeFlagProvider } from "@/domain/provider";
import { executeTransition } from "@/server/workflow";
import { createDraft, db, resetDb, seedFixture } from "./helpers";

type Fixture = Awaited<ReturnType<typeof seedFixture>>;
let fx: Fixture;

beforeEach(async () => {
  await resetDb();
  fx = await seedFixture();
});

afterAll(async () => {
  await db.$disconnect();
});

async function pendingRequest() {
  const draft = await createDraft(fx.developer.id, fx.flag.id);
  const result = await executeTransition({
    db,
    actor: { id: fx.developer.id, role: "DEVELOPER" },
    action: "SUBMIT",
    changeRequestId: draft.id,
    expectedVersion: draft.version,
  });
  expect(result.ok).toBe(true);
  const cr = await db.changeRequest.findUniqueOrThrow({ where: { id: draft.id } });
  return cr;
}

async function appliedRequest() {
  const cr = await pendingRequest();
  const approver = { id: fx.approver.id, role: "RELEASE_APPROVER" as const };
  await executeTransition({ db, actor: approver, action: "APPROVE", changeRequestId: cr.id, expectedVersion: cr.version, decisionRationale: "ok" });
  const approved = await db.changeRequest.findUniqueOrThrow({ where: { id: cr.id } });
  await executeTransition({ db, actor: approver, action: "APPLY", changeRequestId: cr.id, expectedVersion: approved.version });
  return db.changeRequest.findUniqueOrThrow({ where: { id: cr.id } });
}

describe("criterion 1: auditor cannot mutate", () => {
  it("policy denies auditor create/approve/apply/rollback", () => {
    const auditor = { id: fx.auditor.id, role: "AUDITOR" as const };
    for (const action of ["CREATE", "APPROVE", "APPLY", "ROLLBACK"] as const) {
      expect(authorize(auditor, action).ok).toBe(false);
    }
  });

  it("workflow rejects auditor approval and appends no audit event", async () => {
    const cr = await pendingRequest();
    const auditCountBefore = await db.auditEvent.count();
    const result = await executeTransition({
      db,
      actor: { id: fx.auditor.id, role: "AUDITOR" },
      action: "APPROVE",
      changeRequestId: cr.id,
      expectedVersion: cr.version,
    });
    expect(result).toEqual({ ok: false, error: expect.stringContaining("AUDITOR") });
    const after = await db.changeRequest.findUniqueOrThrow({ where: { id: cr.id } });
    expect(after.status).toBe("PENDING_APPROVAL");
    expect(await db.auditEvent.count()).toBe(auditCountBefore);
  });
});

describe("criterion 2: two-person rule", () => {
  it("a requester cannot approve their own request even with approver role", async () => {
    const cr = await pendingRequest();
    const result = await executeTransition({
      db,
      actor: { id: fx.developer.id, role: "RELEASE_APPROVER" },
      action: "APPROVE",
      changeRequestId: cr.id,
      expectedVersion: cr.version,
    });
    expect(result).toEqual({ ok: false, error: expect.stringContaining("own change") });
  });
});

describe("criterion 3: invalid transitions rejected", () => {
  it("guard table only allows the defined edges", () => {
    expect(guardTransition("APPROVE", "DRAFT").ok).toBe(false);
    expect(guardTransition("APPLY", "PENDING_APPROVAL").ok).toBe(false);
    expect(guardTransition("ROLLBACK", "APPROVED").ok).toBe(false);
    expect(guardTransition("SUBMIT", "APPLIED").ok).toBe(false);
    expect(guardTransition("SUBMIT", "DRAFT")).toEqual({ ok: true, to: "PENDING_APPROVAL" });
  });

  it("workflow rejects applying an unapproved request", async () => {
    const cr = await pendingRequest();
    const result = await executeTransition({
      db,
      actor: { id: fx.approver.id, role: "RELEASE_APPROVER" },
      action: "APPLY",
      changeRequestId: cr.id,
      expectedVersion: cr.version,
    });
    expect(result.ok).toBe(false);
    const after = await db.changeRequest.findUniqueOrThrow({ where: { id: cr.id } });
    expect(after.status).toBe("PENDING_APPROVAL");
  });
});

describe("criterion 4: audit events on approve, apply, rollback", () => {
  it("each transition appends an event with actor and before/after state", async () => {
    const cr = await appliedRequest();
    await executeTransition({
      db,
      actor: { id: fx.approver.id, role: "RELEASE_APPROVER" },
      action: "ROLLBACK",
      changeRequestId: cr.id,
      expectedVersion: cr.version,
    });
    const events = await db.auditEvent.findMany({
      where: { changeRequestId: cr.id },
      orderBy: { createdAt: "asc" },
    });
    const actions = events.map((e) => e.action);
    expect(actions).toEqual(["SUBMIT", "APPROVE", "APPLY", "ROLLBACK"]);
    for (const event of events) {
      expect(event.actorId).toBeTruthy();
      expect(event.before).toBeTruthy();
      expect(event.after).toBeTruthy();
    }
    const apply = events.find((e) => e.action === "APPLY");
    expect(apply?.actorId).toBe(fx.approver.id);
    expect(apply?.before).toMatchObject({ status: "APPROVED" });
    expect(apply?.after).toMatchObject({ status: "APPLIED" });
  });
});

describe("criterion 5: rollback restores prior provider state", () => {
  it("flag environment state returns to its pre-apply value", async () => {
    const cr = await appliedRequest();
    const appliedState = await db.flagEnvironmentState.findUniqueOrThrow({
      where: { flagId_environment: { flagId: fx.flag.id, environment: "STAGING" } },
    });
    expect(appliedState.enabled).toBe(true);
    expect(appliedState.rolloutPercentage).toBe(100);

    const result = await executeTransition({
      db,
      actor: { id: fx.approver.id, role: "RELEASE_APPROVER" },
      action: "ROLLBACK",
      changeRequestId: cr.id,
      expectedVersion: cr.version,
    });
    expect(result.ok).toBe(true);

    const restored = await db.flagEnvironmentState.findUniqueOrThrow({
      where: { flagId_environment: { flagId: fx.flag.id, environment: "STAGING" } },
    });
    expect(restored.enabled).toBe(false);
    expect(restored.rolloutPercentage).toBe(0);
    expect(restored.providerVersion).toBeGreaterThan(appliedState.providerVersion);
  });
});

describe("criterion 6: optimistic version check", () => {
  it("a stale approval is rejected", async () => {
    const cr = await pendingRequest();
    const approver = { id: fx.approver.id, role: "RELEASE_APPROVER" as const };
    const first = await executeTransition({
      db, actor: approver, action: "APPROVE", changeRequestId: cr.id, expectedVersion: cr.version,
    });
    expect(first.ok).toBe(true);

    const stale = await executeTransition({
      db, actor: approver, action: "APPROVE", changeRequestId: cr.id, expectedVersion: cr.version,
    });
    expect(stale.ok).toBe(false);
  });

  it("an application with an outdated version is rejected", async () => {
    const cr = await pendingRequest();
    const approver = { id: fx.approver.id, role: "RELEASE_APPROVER" as const };
    await executeTransition({ db, actor: approver, action: "APPROVE", changeRequestId: cr.id, expectedVersion: cr.version });
    const result = await executeTransition({
      db, actor: approver, action: "APPLY", changeRequestId: cr.id, expectedVersion: cr.version,
    });
    expect(result).toEqual({ ok: false, error: expect.stringContaining("Stale") });
  });
});

describe("criterion 7: provider failure is atomic and recoverable", () => {
  it("failed apply keeps APPROVED status, provider state, and writes no audit event", async () => {
    const cr = await pendingRequest();
    const approver = { id: fx.approver.id, role: "RELEASE_APPROVER" as const };
    await executeTransition({ db, actor: approver, action: "APPROVE", changeRequestId: cr.id, expectedVersion: cr.version });
    const approved = await db.changeRequest.findUniqueOrThrow({ where: { id: cr.id } });
    const auditCountBefore = await db.auditEvent.count();

    const result = await executeTransition({
      db,
      actor: approver,
      action: "APPLY",
      changeRequestId: cr.id,
      expectedVersion: approved.version,
      makeProvider: (store) => new FakeFlagProvider(store, () => true),
    });
    expect(result).toEqual({ ok: false, error: expect.stringContaining("refused") });

    const after = await db.changeRequest.findUniqueOrThrow({ where: { id: cr.id } });
    expect(after.status).toBe("APPROVED");
    expect(after.version).toBe(approved.version);
    expect(await db.auditEvent.count()).toBe(auditCountBefore);

    const state = await db.flagEnvironmentState.findUniqueOrThrow({
      where: { flagId_environment: { flagId: fx.flag.id, environment: "STAGING" } },
    });
    expect(state.enabled).toBe(false);

    // Recoverable: the same apply succeeds afterwards with a working provider.
    const retry = await executeTransition({
      db, actor: approver, action: "APPLY", changeRequestId: cr.id, expectedVersion: approved.version,
    });
    expect(retry.ok).toBe(true);
  });
});
