import { NextResponse } from "next/server";
import { currentUser, roleAllows } from "@/lib/access";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleAllows(user.role, "USER"))
    return NextResponse.json({ error: "Access pending" }, { status: 403 });
  return NextResponse.json({ models: [] });
}
