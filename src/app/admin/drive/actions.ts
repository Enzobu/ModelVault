"use server";
import { currentUser } from "@/lib/access";
import { getDriveFolder } from "@/lib/drive";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const user = await currentUser();
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
}
export async function setRootFolder(formData: FormData) {
  await requireAdmin();
  const input = formData.get("folderId");
  if (typeof input !== "string") throw new Error("Missing folder ID");
  const value = input.trim();
  const match = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  const folderId = match?.[1] ?? value;
  const folder = await getDriveFolder(folderId);
  await prisma.driveConnection.update({ where: { id: 1 }, data: { rootFolderId: folder.id, rootFolderName: folder.name } });
  revalidatePath("/admin/drive");
}
export async function disconnectDrive() {
  await requireAdmin();
  await prisma.driveConnection.deleteMany({ where: { id: 1 } });
  revalidatePath("/admin/drive");
}

export async function requestDriveSync() {
  await requireAdmin();
  const connection = await prisma.driveConnection.findUnique({ where: { id: 1 }, select: { rootFolderId: true } });
  if (!connection?.rootFolderId) throw new Error("Configure a Drive root folder first");
  await prisma.driveSyncState.upsert({
    where: { id: 1 },
    create: { id: 1, requested: true },
    update: { requested: true },
  });
  revalidatePath("/admin/drive");
}
