import { createHash } from "node:crypto";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { driveAccessToken } from "@/lib/drive";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return new Response("Invalid ticket", { status: 400 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  // A single atomic claim guarantees a ticket cannot be reused.
  const claimed = await prisma.bridgeTicket.updateMany({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) return new Response("Expired or used ticket", { status: 403 });
  const ticket = await prisma.bridgeTicket.findUnique({ where: { tokenHash }, select: { modelId: true, userId: true } });
  if (!ticket) return new Response("Ticket not found", { status: 404 });
  const [user, model] = await Promise.all([
    prisma.user.findUnique({ where: { id: ticket.userId }, select: { role: true } }),
    prisma.model3D.findFirst({ where: { id: ticket.modelId, isHidden: false, removedFromDrive: false },
      select: { files: { select: { googleFileId: true, filename: true }, orderBy: { filename: "asc" } } } }),
  ]);
  if (!user || user.role === "PENDING" || !model?.files.length) return new Response("Unavailable", { status: 403 });
  const accessToken = await driveAccessToken();
  const archive = archiver("zip", { zlib: { level: 0 } });
  const output = new PassThrough();
  archive.on("error", error => output.destroy(error));
  archive.pipe(output);
  void (async () => {
    try {
      const names = new Set<string>();
      for (const [index, file] of model.files.entries()) {
        const url = "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(file.googleFileId) + "?alt=media";
        const response = await fetch(url, { headers: { Authorization: "Bearer " + accessToken }, cache: "no-store" });
        if (!response.ok || !response.body) throw new Error("Drive file unavailable");
        let filename = file.filename.replace(/[\\/\x00-\x1f]/g, "_").replace(/^\.+/, "_").slice(0, 180) || "piece.stl";
        if (names.has(filename)) filename = index + "_" + filename;
        names.add(filename);
        archive.append(Readable.fromWeb(response.body as import("node:stream/web").ReadableStream), { name: filename });
      }
      await archive.finalize();
    } catch (error) {
      archive.abort();
      output.destroy(error instanceof Error ? error : new Error("Archive error"));
    }
  })();
  return new Response(Readable.toWeb(output) as ReadableStream<Uint8Array>, {
    headers: { "Content-Type": "application/zip", "Cache-Control": "no-store", "Content-Disposition": "attachment; filename=modelvault.zip", "X-Content-Type-Options": "nosniff" },
  });
}
