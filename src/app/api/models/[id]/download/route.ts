import { NextRequest } from "next/server";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import { currentUser, roleAllows } from "@/lib/access";
import { driveAccessToken } from "@/lib/drive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await currentUser();
  if (!viewer || !roleAllows(viewer.role, "USER") || !viewer.onboardingCompleted) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const model = await prisma.model3D.findFirst({
    where: { id, isHidden: false, removedFromDrive: false },
    select: { driveName: true, displayName: true, files: { select: { id: true, googleFileId: true, filename: true, sizeBytes: true }, orderBy: { filename: "asc" } } },
  });
  if (!model) return new Response("Not found", { status: 404 });
  if (!model.files.length) return new Response("No files to download", { status: 404 });
  const totalBytes = model.files.reduce((total, file) => total + (file.sizeBytes ?? 0n), 0n);
  if (model.files.length > 500 || totalBytes > 1_500_000_000n) return new Response("Archive too large", { status: 413 });
  const token = await driveAccessToken();
  const archive = archiver("zip", { zlib: { level: 6 } });
  const output = new PassThrough();
  archive.on("error", error => output.destroy(error));
  archive.pipe(output);
  const usedNames = new Set<string>();
  // The archive consumes each readable stream as it builds the ZIP; no binary buffering.
  void (async () => {
    try {
      for (const file of model.files) {
        const url = "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(file.googleFileId) + "?alt=media";
        const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
        if (!response.ok || !response.body) throw new Error("Google Drive file unavailable: " + file.id);
        const clean = file.filename.replace(/[\\/\x00-\x1f]/g, "_").replace(/^\.+/, "_").slice(0, 200) || "piece";
        let filename = clean;
        if (usedNames.has(filename)) filename = file.id.slice(0, 8) + "_" + clean;
        usedNames.add(filename);
        archive.append(Readable.fromWeb(response.body as import("node:stream/web").ReadableStream), { name: filename });
      }
      await archive.finalize();
    } catch (error) {
      archive.abort();
      output.destroy(error instanceof Error ? error : new Error("Archive failed"));
    }
  })();
  const title = (model.displayName ?? model.driveName).replace(/[\\/\x00-\x1f]/g, "_").slice(0, 100) || "model";
  return new Response(Readable.toWeb(output) as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(title + ".zip"),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
