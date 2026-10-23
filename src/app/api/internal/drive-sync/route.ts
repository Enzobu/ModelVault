import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { indexDriveModels } from "@/lib/drive-indexer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const configured = process.env.DRIVE_SYNC_CRON_SECRET;
  const supplied = request.headers.get("x-sync-secret") ?? "";
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const initial = await prisma.driveSyncState.upsert({
    where: { id: 1 },
    create: { id: 1, requested: true },
    update: {},
  });
  const now = new Date();
  const nextDue = initial.startedAt ? initial.startedAt.getTime() + 60 * 60 * 1000 : 0;
  if (!initial.requested && now.getTime() < nextDue) {
    return NextResponse.json({ status: initial.running ? "running" : "not_due" });
  }
  const stale = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const claimed = await prisma.driveSyncState.updateMany({
    where: { id: 1, OR: [{ running: false }, { startedAt: { lt: stale } }] },
    data: { running: true, requested: false, startedAt: now, lastError: null },
  });
  if (claimed.count !== 1) return NextResponse.json({ status: "running" });
  const started = Date.now();
  try {
    const stats = await indexDriveModels();
    const durationMs = Date.now() - started;
    console.info("Drive synchronization finished", { durationMs, ...stats });
    await prisma.driveSyncState.update({
      where: { id: 1 },
      data: { running: false, completedAt: new Date(), lastResult: JSON.stringify({ ...stats, durationMs }), lastError: null },
    });
    return NextResponse.json({ status: "done", stats, durationMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected synchronization error";
    console.error("Google Drive sync failed:", { durationMs: Date.now() - started, message });
    await prisma.driveSyncState.update({
      where: { id: 1 },
      data: { running: false, completedAt: new Date(), lastError: message.slice(0, 1000) },
    });
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
