"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChangeRequest } from "@/server/actions";

type FlagOption = {
  id: string;
  key: string;
  states: { environment: "DEV" | "STAGING" | "PRODUCTION"; enabled: boolean; rolloutPercentage: number }[];
};

export function NewRequestForm({ flags }: { flags: FlagOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const firstFlag = flags[0];
  const [flagId, setFlagId] = useState(firstFlag?.id ?? "");
  const [environment, setEnvironment] = useState<"DEV" | "STAGING" | "PRODUCTION">("DEV");
  const [enabled, setEnabled] = useState(true);
  const [rollout, setRollout] = useState(100);
  const [rationale, setRationale] = useState("");

  const selected = flags.find((f) => f.id === flagId);
  const current = selected?.states.find((s) => s.environment === environment);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createChangeRequest({
        flagId,
        environment,
        proposedEnabled: enabled,
        proposedRollout: rollout,
        rationale,
      });
      if (!result.ok) setError(result.error);
      else router.push(result.id ? `/requests/${result.id}` : "/");
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-3 border border-edge bg-panel p-5">
      {error ? <p className="border border-red px-2 py-1 text-red">{error}</p> : null}
      <label className="flex flex-col gap-1">
        <span className="text-dim">flag</span>
        <select value={flagId} onChange={(e) => setFlagId(e.target.value)} className="border border-edge bg-ink px-2 py-1.5">
          {flags.map((f) => (
            <option key={f.id} value={f.id}>{f.key}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-dim">virtual environment</span>
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as "DEV" | "STAGING" | "PRODUCTION")}
          className="border border-edge bg-ink px-2 py-1.5"
        >
          <option value="DEV">DEV</option>
          <option value="STAGING">STAGING</option>
          <option value="PRODUCTION">PRODUCTION</option>
        </select>
      </label>
      <p className="text-dim">
        current: {current ? `${current.enabled ? "on" : "off"} @ ${current.rolloutPercentage}%` : "-"}
      </p>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>proposed enabled</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-dim">proposed rollout percentage</span>
        <input
          type="number"
          min={0}
          max={100}
          value={rollout}
          onChange={(e) => setRollout(Number(e.target.value))}
          className="border border-edge bg-ink px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-dim">rationale (min 10 chars)</span>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          className="border border-edge bg-ink px-2 py-1.5"
        />
      </label>
      <button type="submit" disabled={pending} className="border border-amber px-3 py-1.5 text-amber hover:bg-amber hover:text-ink disabled:opacity-50">
        create draft
      </button>
    </form>
  );
}
