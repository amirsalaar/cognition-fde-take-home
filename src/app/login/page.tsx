import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/server/auth";

const DEMO_ACCOUNTS = [
  { email: "dana.dev@example.test", role: "DEVELOPER" },
  { email: "devon.dev@example.test", role: "DEVELOPER" },
  { email: "rae.approver@example.test", role: "RELEASE_APPROVER" },
  { email: "riley.approver@example.test", role: "RELEASE_APPROVER" },
  { email: "ada.auditor@example.test", role: "AUDITOR" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (err) {
      if (err instanceof AuthError) redirect("/login?error=1");
      throw err;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <header>
        <p className="text-dim">flag-control // demo environment // synthetic data only</p>
        <h1 className="mt-1 text-xl text-paper">Feature-Flag Change-Control Plane</h1>
      </header>

      <form action={login} className="flex flex-col gap-3 border border-edge bg-panel p-5">
        {error ? (
          <p className="border border-red px-2 py-1 text-red">Invalid email or password.</p>
        ) : null}
        <label className="flex flex-col gap-1">
          <span className="text-dim">email</span>
          <input
            name="email"
            type="email"
            required
            className="border border-edge bg-ink px-2 py-1.5"
            placeholder="dana.dev@example.test"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-dim">password</span>
          <input
            name="password"
            type="password"
            required
            className="border border-edge bg-ink px-2 py-1.5"
            placeholder="demo-password-123"
          />
        </label>
        <button type="submit" className="mt-1 border border-amber px-3 py-1.5 text-amber hover:bg-amber hover:text-ink">
          sign in
        </button>
      </form>

      <section className="border border-edge bg-panel p-5">
        <h2 className="text-dim">demo accounts (password: demo-password-123)</h2>
        <table className="mt-2 w-full text-left">
          <tbody>
            {DEMO_ACCOUNTS.map((account) => (
              <tr key={account.email} className="border-t border-edge">
                <td className="py-1 pr-4">{account.email}</td>
                <td className="py-1 text-dim">{account.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
