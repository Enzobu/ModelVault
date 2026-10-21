import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { currentUser } from "@/lib/access";
import { driveOAuthCredentials, driveRedirectUri, driveScope } from "@/lib/drive";

export async function GET() {
  const admin = await currentUser();
  if (admin?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const state = randomBytes(32).toString("base64url");
  const { clientId } = driveOAuthCredentials();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: driveRedirectUri(),
    response_type: "code",
    scope: driveScope,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("drive_oauth_state", state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/api/admin/drive/callback", maxAge: 600,
  });
  return response;
}
