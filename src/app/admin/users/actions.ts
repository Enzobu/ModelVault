"use server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/access";
import { revalidatePath } from "next/cache";

export async function setUserRole(formData: FormData) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") throw new Error("Forbidden");
  const id = formData.get("userId");
  const role = formData.get("role");
  if (typeof id !== "string" || !["PENDING", "USER", "EDITOR", "ADMIN"].includes(String(role))) {
    throw new Error("Invalid role");
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("Unknown user");
  // Prevent self-demotion (including suspension) during administration.
  if (target.id === admin.id && role !== "ADMIN") throw new Error("Cannot demote yourself");
  await prisma.user.update({
    where: { id },
    data: { role: role as "PENDING" | "USER" | "EDITOR" | "ADMIN" },
  });
  revalidatePath("/admin/users");
}
