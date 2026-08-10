import type { Prisma } from "@prisma/client";
import type { Tx } from "./db";

// Append-only audit writer. The only write path to AuditEvent in the app.
// Always called inside the same transaction as the state change it records.
export async function appendAuditEvent(
  tx: Tx,
  event: {
    actorId: string;
    action: string;
    changeRequestId?: string;
    before: Prisma.InputJsonValue;
    after: Prisma.InputJsonValue;
  },
): Promise<void> {
  await tx.auditEvent.create({ data: event });
}
