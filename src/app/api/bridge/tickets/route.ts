import { randomBytes, createHash } from "node:crypto";
import { currentUser, roleAllows } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const viewer = await currentUser();
  if (!viewer || !roleAllows(viewer.role, "USER") || !viewer.onboardingCompleted) return new Response("Forbidden", { status: 403 });
  const input = await request.json().catch(() => null) as { modelId?: unknown } | null;
  if (typeof input?.modelId !== "string" || input.modelId.length > 100) return new Response("Invalid model", { status: 400 });
  const model = await prisma.model3D.findFirst({
    where: { id: input.modelId, isHidden: false, removedFromDrive: false, files: { some: {} } },
    select: { id: true },
  });
  if (!model) return new Response("Model not found", { status: 404 });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.bridgeTicket.create({
    data: { tokenHash, modelId: model.id, userId: viewer.id, expiresAt: new Date(Date.now() + 2 * 60_000) },
  });
  const origin = process.env.AUTH_URL;
  if (!origin || !/^https:\/\//.test(origin)) return new Response("Invalid public origin", { status: 500 });
  const base = new URL(origin);
  const protocolUrl = new URL("modelvault://open");
  protocolUrl.searchParams.set("base", base.origin);
  protocolUrl.searchParams.set("token", token);
  return Response.json({ url: protocolUrl.toString() }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
