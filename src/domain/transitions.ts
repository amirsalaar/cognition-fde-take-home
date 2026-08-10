import { ChangeRequestStatus } from "@prisma/client";

export type TransitionAction =
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "APPLY"
  | "ROLLBACK";

const TRANSITIONS: Record<
  TransitionAction,
  { from: ChangeRequestStatus; to: ChangeRequestStatus }
> = {
  SUBMIT: { from: "DRAFT", to: "PENDING_APPROVAL" },
  APPROVE: { from: "PENDING_APPROVAL", to: "APPROVED" },
  REJECT: { from: "PENDING_APPROVAL", to: "REJECTED" },
  APPLY: { from: "APPROVED", to: "APPLIED" },
  ROLLBACK: { from: "APPLIED", to: "ROLLED_BACK" },
};

export type TransitionResult =
  | { ok: true; to: ChangeRequestStatus }
  | { ok: false; error: string };

export function guardTransition(
  action: TransitionAction,
  current: ChangeRequestStatus,
): TransitionResult {
  const rule = TRANSITIONS[action];
  if (rule.from !== current) {
    return {
      ok: false,
      error: `Cannot ${action} a change request in status ${current}. Requires ${rule.from}.`,
    };
  }
  return { ok: true, to: rule.to };
}
