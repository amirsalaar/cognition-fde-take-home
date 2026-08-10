"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  applyChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  rollbackChangeRequest,
  submitChangeRequest,
} from "@/server/actions";
import type { WorkflowResult } from "@/server/workflow";

type ActionName = "submit" | "approve" | "reject" | "apply" | "rollback";

const ACTIONS: Record<
  ActionName,
  {
    run: (input: { changeRequestId: string; expectedVersion: number; decisionRationale?: string }) => Promise<WorkflowResult>;
    className: string;
    needsRationale: boolean;
  }
> = {
  submit: { run: submitChangeRequest, className: "border-amber text-amber", needsRationale: false },
  approve: { run: approveChangeRequest, className: "border-blue text-blue", needsRationale: true },
  reject: { run: rejectChangeRequest, className: "border-red text-red", needsRationale: true },
  apply: { run: applyChangeRequest, className: "border-green text-green", needsRationale: false },
  rollback: { run: rollbackChangeRequest, className: "border-paper text-paper", needsRationale: false },
};

export function ActionsPanel({
  changeRequestId,
  version,
  available,
}: {
  changeRequestId: string;
  version: number;
  available: ActionName[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");

  if (available.length === 0) return null;

  const needsRationale = available.some((a) => ACTIONS[a].needsRationale);

  function run(action: ActionName) {
    setError(null);
    startTransition(async () => {
      const result = await ACTIONS[action].run({
        changeRequestId,
        expectedVersion: version,
        decisionRationale: ACTIONS[action].needsRationale ? rationale : undefined,
      });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="border border-edge bg-panel p-4">
      <h2 className="text-dim">actions</h2>
      {needsRationale ? (
        <input
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="decision rationale"
          className="mt-2 w-full border border-edge bg-ink px-2 py-1"
        />
      ) : null}
      <div className="mt-3 flex gap-2">
        {available.map((action) => (
          <button
            key={action}
            disabled={pending}
            onClick={() => run(action)}
            className={`border px-3 py-1 uppercase disabled:opacity-50 ${ACTIONS[action].className}`}
          >
            {action}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 border border-red px-2 py-1 text-red">{error}</p> : null}
    </div>
  );
}
