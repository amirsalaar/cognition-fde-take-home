import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "./db";
import type { Actor } from "@/domain/policy";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (user === null) return null;
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.sub === "string") session.user.id = token.sub;
      const role = token.role;
      if (role === "DEVELOPER" || role === "RELEASE_APPROVER" || role === "AUDITOR") {
        session.user.role = role;
      }
      return session;
    },
  },
});

// Server-side session lookup used by every mutation. UI visibility is not authorization.
export async function requireActor(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("Not authenticated.");
  }
  return { id: session.user.id, role: session.user.role };
}
