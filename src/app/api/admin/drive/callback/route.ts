import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { driveOAuthCredentials, driveRedirectUri, driveScope, encryptToken } from "@/lib/drive";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const expected = cookieStore.get("drive_oauth_state")?.value;
  cookieStore.delete("drive_oauth_state");
  const admin = await currentUser();
  if (admin?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code");
  if (!expected || !state || !code || expected.length !== state.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(state))) {
    return new Response("Invalid OAuth state", { status: 400 });
  }
  const { clientId, clientSecret } = driveOAuthCredentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: driveRedirectUri(), grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!response.ok) return new Response("Google OAuth exchange failed", { status: 502 });
  const tokens = await response.json() as { refresh_token?: string; scope?: string };
  if (!tokens.refresh_token || !tokens.scope?.split(" ").includes(driveScope)) {
    return new Response("Google did not grant Drive offline read-only access", { status: 400 });
  }
  await prisma.driveConnection.upsert({
    where: { id: 1 },
    create: { id: 1, refreshToken: encryptToken(tokens.refresh_token), connectedById: admin.id },
    update: { refreshToken: encryptToken(tokens.refresh_token), connectedById: admin.id },
  });
  return NextResponse.redirect(new URL("/admin/drive?connected=1", request.url));
}
