import { NextRequest } from "next/server";
import { currentUser, roleAllows } from "@/lib/access";
import { driveAccessToken } from "@/lib/drive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const viewer = await currentUser();
  if (!viewer || !roleAllows(viewer.role, "USER") || !viewer.onboardingCompleted) {
    return new Response("Forbidden", { status: 403 });
  }
  const { id, fileId } = await params;
  const file = await prisma.modelFile.findFirst({
    where: { id: fileId, modelId: id, model: { isHidden: false, removedFromDrive: false } },
    select: { googleFileId: true, filename: true, format: true },
  });
  if (!file) return new Response("Not found", { status: 404 });
  const token = await driveAccessToken();
  const url = "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(file.googleFileId) + "?alt=media";
  const upstream = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
  if (!upstream.ok || !upstream.body) return new Response("File unavailable", { status: 502 });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(request.nextUrl.searchParams.has("download") ? {
        "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(file.filename),
      } : {}),
    },
  });
}
