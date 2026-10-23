import { createHash } from "node:crypto";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

export function thumbnailRevision(model: {
  previewFileId: string | null;
  previewRotationX: number; previewRotationY: number; previewRotationZ: number; previewZoom: number;
  files: Array<{ id: string; googleFileId?: string; filename?: string; format?: string }>;
}) {
  const selected = model.files.find(file => file.id === model.previewFileId) ?? model.files[0];
  if (!selected) return null;
  const fingerprint = [selected.googleFileId ?? selected.id, selected.filename ?? "", selected.format ?? "",
    model.previewRotationX, model.previewRotationY, model.previewRotationZ, model.previewZoom].join("|");
  return createHash("sha256").update(fingerprint).digest("hex").slice(0, 16);
}

export function thumbnailFile(modelId: string, revision: string) {
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(modelId) || !/^[a-f0-9]{16}$/.test(revision)) throw new Error("Invalid thumbnail key");
  return path.join(process.cwd(), "data", "thumbnails", modelId + "-" + revision + ".png");
}

export async function ensureThumbnailsDirectory() {
  await mkdir(path.join(process.cwd(), "data", "thumbnails"), { recursive: true });
}

export async function authorizedThumbnailModel(id: string) {
  return prisma.model3D.findFirst({
    where: { id, isHidden: false, removedFromDrive: false },
    select: { id: true, previewFileId: true, previewRotationX: true, previewRotationY: true,
      previewRotationZ: true, previewZoom: true,
      files: { orderBy: { filename: "asc" }, select: { id: true, googleFileId: true, filename: true, format: true } } },
  });
}
