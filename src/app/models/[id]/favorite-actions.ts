"use server";
import { revalidatePath } from "next/cache";
import { currentUser, roleAllows } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export async function toggleFavorite(form: FormData) {
  const viewer = await currentUser();
  if (!viewer || !roleAllows(viewer.role, "USER") || !viewer.onboardingCompleted) throw new Error("Forbidden");
  const modelId = form.get("modelId");
  if (typeof modelId !== "string" || !modelId) throw new Error("Model required");
  const model = await prisma.model3D.findFirst({ where: { id: modelId, isHidden: false, removedFromDrive: false }, select: { id: true } });
  if (!model) throw new Error("Model unavailable");
  const key = { userId_modelId: { userId: viewer.id, modelId } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) await prisma.favorite.delete({ where: key });
  else await prisma.favorite.create({ data: { userId: viewer.id, modelId } });
  revalidatePath("/");
  revalidatePath("/models/" + modelId);
}
