import { Role } from "@prisma/client";
import type { TransitionAction } from "./transitions";

export type PolicyAction = TransitionAction | "CREATE" | "EDIT";

export type Actor = { id: string; role: Role };

const ROLE_ACTIONS: Record<Role, ReadonlySet<PolicyAction>> = {
  DEVELOPER: new Set<PolicyAction>(["CREATE", "EDIT", "SUBMIT"]),
  RELEASE_APPROVER: new Set<PolicyAction>([
    "APPROVE",
    "REJECT",
    "APPLY",
    "ROLLBACK",
  ]),
  AUDITOR: new Set<PolicyAction>(),
};

export type PolicyResult = { ok: true } | { ok: false; error: string };

export function authorize(
  actor: Actor,
  action: PolicyAction,
  request?: { requesterId: string },
): PolicyResult {
  if (!ROLE_ACTIONS[actor.role].has(action)) {
    return { ok: false, error: `Role ${actor.role} is not allowed to ${action}.` };
  }
  // Two-person rule: a requester never decides on their own change.
  if (
    (action === "APPROVE" || action === "REJECT") &&
    request !== undefined &&
    request.requesterId === actor.id
  ) {
    return { ok: false, error: "Requesters cannot approve or reject their own change." };
  }
  return { ok: true };
}
