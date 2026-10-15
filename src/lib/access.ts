import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";

const permissions: Record<Role, readonly Role[]> = {
  PENDING: ["PENDING"],
  USER: ["USER"],
  EDITOR: ["USER", "EDITOR"],
  ADMIN: ["USER", "EDITOR", "ADMIN"],
};

export function roleAllows(role: Role, required: "USER" | "EDITOR" | "ADMIN") {
  return permissions[role].includes(required);
}

/** Fetch the current database role, so suspension takes effect on the next request. */
export async function currentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user ?? null;
}
