import { createHash } from "node:crypto";
import path from "node:path";
import { mkdir, readdir, stat, rm } from "node:fs/promises";
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

/** Expire unused thumbnail variants after 45 days. Safe to run periodically. */
export async function pruneThumbnailCache(maxAgeMs = 45 * 24 * 60 * 60 * 1000) {
  const directory = path.join(process.cwd(), "data", "thumbnails");
  let names: string[];
  try { names = await readdir(directory); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
  let removed = 0;
  const cutoff = Date.now() - maxAgeMs;
  for (const filename of names.slice(0, 50000)) {
    if (!/^[a-zA-Z0-9_-]{8,100}-[a-f0-9]{16}\.png$/.test(filename)) continue;
    const file = path.join(directory, filename);
    try {
      if ((await stat(file)).mtimeMs < cutoff) { await rm(file, { force: true }); removed++; }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return removed;
}
