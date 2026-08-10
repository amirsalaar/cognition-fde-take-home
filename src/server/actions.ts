"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { VirtualEnvironment } from "@prisma/client";
import { authorize } from "@/domain/policy";
import type { TransitionAction } from "@/domain/transitions";
import { appendAuditEvent } from "./audit";
import { requireActor } from "./auth";
import { prisma } from "./db";
import { executeTransition, type WorkflowResult } from "./workflow";

const createSchema = z.object({
  flagId: z.string().min(1),
  environment: z.nativeEnum(VirtualEnvironment),
  proposedEnabled: z.boolean(),
  proposedRollout: z.number().int().min(0).max(100),
  rationale: z.string().min(10, "Rationale must be at least 10 characters."),
});

export async function createChangeRequest(
  input: z.infer<typeof createSchema>,
): Promise<WorkflowResult & { id?: string }> {
  const actor = await requireActor();
  const policy = authorize(actor, "CREATE");
  if (!policy.ok) return policy;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  const state = await prisma.flagEnvironmentState.findUnique({
    where: {
      flagId_environment: {
        flagId: parsed.data.flagId,
        environment: parsed.data.environment,
      },
    },
  });
  if (state === null) return { ok: false, error: "Unknown flag or environment." };

  const id = await prisma.$transaction(async (tx) => {
    const cr = await tx.changeRequest.create({
      data: {
        flagId: parsed.data.flagId,
        environment: parsed.data.environment,
        beforeEnabled: state.enabled,
        beforeRollout: state.rolloutPercentage,
        proposedEnabled: parsed.data.proposedEnabled,
        proposedRollout: parsed.data.proposedRollout,
        rationale: parsed.data.rationale,
        requesterId: actor.id,
      },
    });
    await appendAuditEvent(tx, {
      actorId: actor.id,
      action: "CREATE",
      changeRequestId: cr.id,
      before: {},
      after: {
        status: "DRAFT",
        flag: {
          enabled: parsed.data.proposedEnabled,
          rolloutPercentage: parsed.data.proposedRollout,
        },
      },
    });
    return cr.id;
  });

  revalidatePath("/");
  return { ok: true, id };
}

const transitionSchema = z.object({
  changeRequestId: z.string().min(1),
  expectedVersion: z.number().int().positive(),
  decisionRationale: z.string().max(500).optional(),
});

async function runTransition(
  action: TransitionAction,
  raw: z.infer<typeof transitionSchema>,
): Promise<WorkflowResult> {
  const actor = await requireActor();
  const parsed = transitionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const result = await executeTransition({
    db: prisma,
    actor,
    action,
    changeRequestId: parsed.data.changeRequestId,
    expectedVersion: parsed.data.expectedVersion,
    decisionRationale: parsed.data.decisionRationale,
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/requests/${parsed.data.changeRequestId}`);
  }
  return result;
}

export async function submitChangeRequest(input: z.infer<typeof transitionSchema>) {
  return runTransition("SUBMIT", input);
}
export async function approveChangeRequest(input: z.infer<typeof transitionSchema>) {
  return runTransition("APPROVE", input);
}
export async function rejectChangeRequest(input: z.infer<typeof transitionSchema>) {
  return runTransition("REJECT", input);
}
export async function applyChangeRequest(input: z.infer<typeof transitionSchema>) {
  return runTransition("APPLY", input);
}
export async function rollbackChangeRequest(input: z.infer<typeof transitionSchema>) {
  return runTransition("ROLLBACK", input);
}
