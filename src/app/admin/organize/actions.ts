"use server";
import { revalidatePath } from "next/cache";
import { currentUser, roleAllows } from "@/lib/access";
import { prisma } from "@/lib/prisma";

async function requireEditor() {
  const viewer = await currentUser();
  if (!viewer || !roleAllows(viewer.role, "EDITOR")) throw new Error("Forbidden");
}

function textField(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function createCategory(form: FormData) {
  await requireEditor();
  const name = textField(form.get("name"), 80);
  if (!name) throw new Error("Category name required");
  await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
  revalidatePath("/admin/organize");
}
export async function createTag(form: FormData) {
  await requireEditor();
  const name = textField(form.get("name"), 80);
  if (!name) throw new Error("Tag name required");
  await prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
  revalidatePath("/admin/organize");
}
export async function saveModelOrganization(form: FormData) {
  await requireEditor();
  const modelId = textField(form.get("modelId"), 100);
  if (!modelId) throw new Error("Model required");
  const model = await prisma.model3D.findFirst({ where: { id: modelId, removedFromDrive: false }, select: { id: true, files: { select: { id: true } } } });
  if (!model) throw new Error("Model not found");
  const name = textField(form.get("displayName"), 180);
  const description = textField(form.get("description"), 3000);
  const category = textField(form.get("categoryId"), 100);
  const preview = textField(form.get("previewFileId"), 100);
  if (preview && !model.files.some(file => file.id === preview)) throw new Error("Invalid preview file");
  if (category && !await prisma.category.findUnique({ where: { id: category } })) throw new Error("Invalid category");
  const tagIds = form.getAll("tagIds").filter((tag): tag is string => typeof tag === "string").slice(0, 30);
  const existingTags = await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } });
  if (existingTags.length !== new Set(tagIds).size) throw new Error("Invalid tags");
  const numeric = (key: string, fallback: number, lower: number, upper: number) => {
    const input = form.get(key);
    const value = typeof input === "string" && input.trim() ? Number(input) : fallback;
    if (!Number.isFinite(value) || value < lower || value > upper) throw new Error("Invalid " + key);
    return value;
  };
  await prisma.$transaction(async tx => {
    await tx.model3D.update({
      where: { id: modelId },
      data: {
        displayName: name || null, description: description || null, organized: true,
        categoryId: category || null, previewFileId: preview || null,
        previewRotationX: numeric("rotationX", 0, -360, 360),
        previewRotationY: numeric("rotationY", 0, -360, 360),
        previewRotationZ: numeric("rotationZ", 0, -360, 360),
        previewZoom: numeric("zoom", 1, 0.1, 10),
      },
    });
    await tx.modelTag.deleteMany({ where: { modelId } });
    if (existingTags.length) await tx.modelTag.createMany({ data: existingTags.map(tag => ({ modelId, tagId: tag.id })) });
  });
  revalidatePath("/admin/organize");
  revalidatePath("/models/" + modelId);
  revalidatePath("/");
}
export async function bulkOrganize(form: FormData) {
  await requireEditor();
  const ids = form.getAll("modelIds").filter((v): v is string => typeof v === "string").slice(0, 100);
  if (!ids.length) return;
  const categoryId = textField(form.get("categoryId"), 100);
  if (categoryId && !await prisma.category.findUnique({ where: { id: categoryId } })) throw new Error("Invalid category");
  await prisma.model3D.updateMany({
    where: { id: { in: ids }, removedFromDrive: false },
    data: { organized: true, ...(categoryId ? { categoryId } : {}) },
  });
  revalidatePath("/admin/organize");
  revalidatePath("/");
}
