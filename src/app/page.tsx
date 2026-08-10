import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangeRequestStatus, VirtualEnvironment, type Prisma } from "@prisma/client";
import { auth, signOut } from "@/server/auth";
import { prisma } from "@/server/db";
import { STATUS_CLASS, age, formatValue } from "./ui";

const STATUSES = Object.values(ChangeRequestStatus);
const ENVIRONMENTS = Object.values(VirtualEnvironment);

function parseStatus(value: string | undefined): ChangeRequestStatus | undefined {
  return STATUSES.find((s) => s === value);
}
function parseEnvironment(value: string | undefined): VirtualEnvironment | undefined {
  return ENVIRONMENTS.find((e) => e === value);
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; env?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { q, status: rawStatus, env: rawEnv } = await searchParams;
  const status = parseStatus(rawStatus);
  const environment = parseEnvironment(rawEnv);

  const where: Prisma.ChangeRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(environment ? { environment } : {}),
    ...(q
      ? {
          OR: [
            { flag: { key: { contains: q, mode: "insensitive" } } },
            { rationale: { contains: q, mode: "insensitive" } },
            { requester: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const requests = await prisma.changeRequest.findMany({
    where,
    include: {
      flag: true,
      requester: true,
      auditEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const { user } = session;

  return (
    <main className="mx-auto max-w-7xl p-6">
      <header className="flex items-baseline justify-between border-b border-edge pb-3">
        <div>
          <p className="text-dim">flag-control // change queue // synthetic data only</p>
          <h1 className="text-lg">Change-Control Queue</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-dim">
            {user.name} <span className="text-amber">[{user.role}]</span>
          </span>
          {user.role === "DEVELOPER" ? (
            <Link href="/requests/new" className="border border-amber px-2 py-1 text-amber hover:bg-amber hover:text-ink">
              + new request
            </Link>
          ) : null}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="border border-edge px-2 py-1 text-dim hover:text-paper">
              sign out
            </button>
          </form>
        </div>
      </header>

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="search flag, rationale, requester"
          className="w-72 border border-edge bg-panel px-2 py-1"
        />
        <select name="status" defaultValue={status ?? ""} className="border border-edge bg-panel px-2 py-1">
          <option value="">status: all</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="env" defaultValue={environment ?? ""} className="border border-edge bg-panel px-2 py-1">
          <option value="">env: all</option>
          {ENVIRONMENTS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <button type="submit" className="border border-edge px-3 py-1 hover:border-paper">filter</button>
      </form>

      <table className="mt-4 w-full text-left">
        <thead className="text-dim">
          <tr className="border-b border-edge">
            <th className="py-1.5 pr-3 font-normal">flag</th>
            <th className="py-1.5 pr-3 font-normal">env</th>
            <th className="py-1.5 pr-3 font-normal">current</th>
            <th className="py-1.5 pr-3 font-normal">proposed</th>
            <th className="py-1.5 pr-3 font-normal">status</th>
            <th className="py-1.5 pr-3 font-normal">requester</th>
            <th className="py-1.5 pr-3 font-normal">age</th>
            <th className="py-1.5 font-normal">last action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((cr) => (
            <tr key={cr.id} className="border-b border-edge hover:bg-panel">
              <td className="py-1.5 pr-3">
                <Link href={`/requests/${cr.id}`} className="text-blue underline underline-offset-2">
                  {cr.flag.key}
                </Link>
              </td>
              <td className="py-1.5 pr-3">{cr.environment}</td>
              <td className="py-1.5 pr-3 text-dim">{formatValue(cr.beforeEnabled, cr.beforeRollout)}</td>
              <td className="py-1.5 pr-3">{formatValue(cr.proposedEnabled, cr.proposedRollout)}</td>
              <td className="py-1.5 pr-3">
                <span className={`status-chip ${STATUS_CLASS[cr.status]}`}>{cr.status}</span>
              </td>
              <td className="py-1.5 pr-3">{cr.requester.name}</td>
              <td className="py-1.5 pr-3 text-dim">{age(cr.createdAt)}</td>
              <td className="py-1.5 text-dim">{cr.auditEvents[0]?.action ?? "-"}</td>
            </tr>
          ))}
          {requests.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-6 text-center text-dim">no change requests match</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </main>
  );
}
