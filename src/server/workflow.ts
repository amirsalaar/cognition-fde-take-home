import type { PrismaClient, VirtualEnvironment } from "@prisma/client";
import { authorize, type Actor } from "@/domain/policy";
import { guardTransition, type TransitionAction } from "@/domain/transitions";
import {
  FakeFlagProvider,
  type FeatureFlagProvider,
  type FlagValue,
  type ProviderStore,
} from "@/domain/provider";
import { appendAuditEvent } from "./audit";
import type { Tx } from "./db";

export type WorkflowResult = { ok: true } | { ok: false; error: string };

class WorkflowError extends Error {}

function txProviderStore(tx: Tx): ProviderStore {
  return {
    async read(flagKey: string, environment: VirtualEnvironment) {
      const state = await tx.flagEnvironmentState.findFirst({
        where: { environment, flag: { key: flagKey } },
      });
      if (state === null) return null;
      return {
        enabled: state.enabled,
        rolloutPercentage: state.rolloutPercentage,
        providerVersion: state.providerVersion,
      };
    },
    async write(flagKey, environment, value, providerVersion) {
      const state = await tx.flagEnvironmentState.findFirst({
        where: { environment, flag: { key: flagKey } },
      });
      if (state === null) throw new WorkflowError(`Unknown flag ${flagKey}.`);
      await tx.flagEnvironmentState.update({
        where: { id: state.id },
        data: { ...value, providerVersion },
      });
    },
  };
}

export async function executeTransition(opts: {
  db: PrismaClient;
  actor: Actor;
  action: TransitionAction;
  changeRequestId: string;
  expectedVersion: number;
  decisionRationale?: string;
  makeProvider?: (store: ProviderStore) => FeatureFlagProvider;
}): Promise<WorkflowResult> {
  const { db, actor, action, changeRequestId, expectedVersion } = opts;
  try {
    await db.$transaction(async (tx) => {
      const cr = await tx.changeRequest.findUnique({
        where: { id: changeRequestId },
        include: { flag: true },
      });
      if (cr === null) throw new WorkflowError("Change request not found.");

      const policy = authorize(actor, action, { requesterId: cr.requesterId });
      if (!policy.ok) throw new WorkflowError(policy.error);

      const guard = guardTransition(action, cr.status);
      if (!guard.ok) throw new WorkflowError(guard.error);

      if (cr.version !== expectedVersion) {
        throw new WorkflowError(
          `Stale request: expected version ${expectedVersion}, found ${cr.version}. Reload and retry.`,
        );
      }

      let providerVersion: number | null = null;
      if (action === "APPLY" || action === "ROLLBACK") {
        const store = txProviderStore(tx);
        const provider = opts.makeProvider?.(store) ?? new FakeFlagProvider(store);
        const target: FlagValue =
          action === "APPLY"
            ? { enabled: cr.proposedEnabled, rolloutPercentage: cr.proposedRollout }
            : { enabled: cr.beforeEnabled, rolloutPercentage: cr.beforeRollout };
        const result =
          action === "APPLY"
            ? await provider.applyChange(cr.flag.key, cr.environment, target)
            : await provider.rollbackChange(cr.flag.key, cr.environment, target);
        if (!result.ok) throw new WorkflowError(result.error);
        providerVersion = result.providerVersion;
      }

      // Optimistic concurrency: the version filter makes a racing duplicate a no-op.
      const updated = await tx.changeRequest.updateMany({
        where: { id: cr.id, version: expectedVersion },
        data: {
          status: guard.to,
          version: expectedVersion + 1,
          ...(action === "APPROVE" || action === "REJECT"
            ? { approverId: actor.id, decisionRationale: opts.decisionRationale ?? null }
            : {}),
        },
      });
      if (updated.count !== 1) {
        throw new WorkflowError("Concurrent update detected. Reload and retry.");
      }

      if (action === "APPROVE" || action === "REJECT") {
        await tx.approval.create({
          data: {
            changeRequestId: cr.id,
            approverId: actor.id,
            decision: action === "APPROVE" ? "APPROVE" : "REJECT",
            rationale: opts.decisionRationale ?? "",
          },
        });
      }

      await appendAuditEvent(tx, {
        actorId: actor.id,
        action,
        changeRequestId: cr.id,
        before: {
          status: cr.status,
          version: cr.version,
          flag: { enabled: cr.beforeEnabled, rolloutPercentage: cr.beforeRollout },
        },
        after: {
          status: guard.to,
          version: cr.version + 1,
          flag:
            action === "ROLLBACK"
              ? { enabled: cr.beforeEnabled, rolloutPercentage: cr.beforeRollout }
              : { enabled: cr.proposedEnabled, rolloutPercentage: cr.proposedRollout },
          ...(providerVersion !== null ? { providerVersion } : {}),
          ...(opts.decisionRationale !== undefined
            ? { decisionRationale: opts.decisionRationale }
            : {}),
        },
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkflowError) return { ok: false, error: error.message };
    throw error;
  }
}
