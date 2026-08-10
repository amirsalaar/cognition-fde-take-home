import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { NewRequestForm } from "./new-request-form";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DEVELOPER") redirect("/");

  const flags = await prisma.featureFlag.findMany({
    include: { states: true },
    orderBy: { key: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/" className="text-dim hover:text-paper">&larr; back to queue</Link>
      <h1 className="mt-3 text-lg">New change request</h1>
      <div className="mt-4">
        <NewRequestForm
          flags={flags.map((f) => ({
            id: f.id,
            key: f.key,
            states: f.states.map((s) => ({
              environment: s.environment,
              enabled: s.enabled,
              rolloutPercentage: s.rolloutPercentage,
            })),
          }))}
        />
      </div>
    </main>
  );
}
