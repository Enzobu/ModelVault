import { readFile, writeFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { currentUser, roleAllows } from "@/lib/access";
import { authorizedThumbnailModel, ensureThumbnailsDirectory, thumbnailFile, thumbnailRevision } from "@/lib/thumbnails";

export const runtime = "nodejs";
const MAX_BYTES = 650_000;
async function allowed() {
  const user = await currentUser();
  return Boolean(user && roleAllows(user.role, "USER") && user.onboardingCompleted);
}
async function resolve(id: string) {
  const model = await authorizedThumbnailModel(id);
  const revision = model && thumbnailRevision(model);
  return model && revision ? { revision, path: thumbnailFile(model.id, revision) } : null;
}
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await allowed()) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const item = await resolve(id);
  if (!item) return new Response("Not found", { status: 404 });
  try {
    const image = await readFile(item.path);
    return new Response(image, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    return new Response("Thumbnail unavailable", { status: 500 });
  }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await allowed()) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const item = await resolve(id);
  if (!item) return new Response("Not found", { status: 404 });
  if (request.headers.get("content-type") !== "image/png") return new Response("PNG required", { status: 415 });
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > MAX_BYTES) return new Response("Thumbnail too large", { status: 413 });
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES || bytes.length < 32 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      bytes.readUInt32BE(16) !== 320 || bytes.readUInt32BE(20) !== 240)
    return new Response("Invalid thumbnail", { status: 400 });
  await ensureThumbnailsDirectory();
  const temp = item.path + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temp, bytes, { flag: "wx", mode: 0o600 });
    await rename(temp, item.path);
  } finally {
    await rm(temp, { force: true }).catch(() => {});
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
