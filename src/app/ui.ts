import type { ChangeRequestStatus } from "@prisma/client";

export const STATUS_CLASS: Record<ChangeRequestStatus, string> = {
  DRAFT: "border-dim text-dim",
  PENDING_APPROVAL: "border-amber text-amber",
  APPROVED: "border-blue text-blue",
  REJECTED: "border-red text-red",
  APPLIED: "border-green text-green",
  ROLLED_BACK: "border-paper text-paper",
};

export function formatValue(enabled: boolean, rollout: number): string {
  return `${enabled ? "on" : "off"} @ ${rollout}%`;
}

export function age(from: Date): string {
  const ms = Date.now() - from.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
