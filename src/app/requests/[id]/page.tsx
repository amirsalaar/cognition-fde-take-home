import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authorize } from "@/domain/policy";
import { guardTransition, type TransitionAction } from "@/domain/transitions";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { STATUS_CLASS, formatValue } from "@/app/ui";
import { ActionsPanel } from "./actions-panel";

const ACTION_ORDER: { name: Lowercase<TransitionAction>; action: TransitionAction }[] = [
  { name: "submit", action: "SUBMIT" },
  { name: "approve", action: "APPROVE" },
  { name: "reject", action: "REJECT" },
  { name: "apply", action: "APPLY" },
  { name: "rollback", action: "ROLLBACK" },
];

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const cr = await prisma.changeRequest.findUnique({
    where: { id },
    include: {
      flag: { include: { states: true } },
      requester: true,
      approver: true,
      approvals: { include: { approver: true }, orderBy: { createdAt: "asc" } },
      auditEvents: { include: { actor: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (cr === null) notFound();

  const actor = { id: session.user.id, role: session.user.role };
  const available = ACTION_ORDER.filter(
    ({ action }) =>
      authorize(actor, action, { requesterId: cr.requesterId }).ok &&
      guardTransition(action, cr.status).ok,
  ).map(({ name }) => name);

  const envState = cr.flag.states.find((s) => s.environment === cr.environment);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/" className="text-dim hover:text-paper">&larr; back to queue</Link>

      <header className="mt-3 flex items-baseline justify-between border-b border-edge pb-3">
        <h1 className="text-lg">
          {cr.flag.key} <span className="text-dim">/ {cr.environment}</span>
        </h1>
        <span className={`status-chip ${STATUS_CLASS[cr.status]}`}>{cr.status}</span>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-4">
        <div className="border border-edge bg-panel p-4">
          <h2 className="text-dim">proposed change</h2>
          <table className="mt-2 w-full">
            <tbody>
              <tr className="border-t border-edge">
                <td className="py-1 text-dim">before</td>
                <td className="py-1">{formatValue(cr.beforeEnabled, cr.beforeRollout)}</td>
              </tr>
              <tr className="border-t border-edge">
                <td className="py-1 text-dim">proposed</td>
                <td className="py-1 text-amber">{formatValue(cr.proposedEnabled, cr.proposedRollout)}</td>
              </tr>
              <tr className="border-t border-edge">
                <td className="py-1 text-dim">provider now</td>
                <td className="py-1">
                  {envState
                    ? `${formatValue(envState.enabled, envState.rolloutPercentage)} (v${envState.providerVersion})`
                    : "-"}
                </td>
              </tr>
              <tr className="border-t border-edge">
                <td className="py-1 text-dim">requester</td>
                <td className="py-1">{cr.requester.name}</td>
              </tr>
              <tr className="border-t border-edge">
                <td className="py-1 text-dim">approver</td>
                <td className="py-1">{cr.approver?.name ?? "-"}</td>
              </tr>
              <tr className="border-t border-edge">
                <td className="py-1 text-dim">request version</td>
                <td className="py-1">{cr.version}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 border-t border-edge pt-2 text-dim">rationale</p>
          <p className="mt-1">{cr.rationale}</p>
          {cr.decisionRationale ? (
            <>
              <p className="mt-3 border-t border-edge pt-2 text-dim">decision rationale</p>
              <p className="mt-1">{cr.decisionRationale}</p>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <ActionsPanel changeRequestId={cr.id} version={cr.version} available={available} />

          <div className="border border-edge bg-panel p-4">
            <h2 className="text-dim">approvals</h2>
            {cr.approvals.length === 0 ? (
              <p className="mt-2 text-dim">none yet</p>
            ) : (
              <ul className="mt-2">
                {cr.approvals.map((a) => (
                  <li key={a.id} className="border-t border-edge py-1">
                    <span className={a.decision === "APPROVE" ? "text-green" : "text-red"}>{a.decision}</span>{" "}
                    by {a.approver.name} <span className="text-dim">{a.createdAt.toISOString()}</span>
                    <p className="text-dim">{a.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 border border-edge bg-panel p-4">
        <h2 className="text-dim">audit trail (append-only)</h2>
        <table className="mt-2 w-full text-left">
          <thead className="text-dim">
            <tr className="border-b border-edge">
              <th className="py-1 pr-3 font-normal">time</th>
              <th className="py-1 pr-3 font-normal">actor</th>
              <th className="py-1 pr-3 font-normal">action</th>
              <th className="py-1 pr-3 font-normal">before</th>
              <th className="py-1 font-normal">after</th>
            </tr>
          </thead>
          <tbody>
            {cr.auditEvents.map((event) => (
              <tr key={event.id} className="border-b border-edge align-top">
                <td className="py-1 pr-3 text-dim">{event.createdAt.toISOString()}</td>
                <td className="py-1 pr-3">{event.actor.name}</td>
                <td className="py-1 pr-3 text-amber">{event.action}</td>
                <td className="py-1 pr-3 text-dim">{JSON.stringify(event.before)}</td>
                <td className="py-1">{JSON.stringify(event.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
