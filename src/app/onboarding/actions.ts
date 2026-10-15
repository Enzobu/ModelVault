"use server";
import { currentUser, roleAllows } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { isPalette, themes, variants } from "@/lib/appearance";
import { redirect } from "next/navigation";

export async function saveAppearance(formData: FormData) {
  const user = await currentUser();
  if (!user || !roleAllows(user.role, "USER")) throw new Error("Forbidden");
  const theme = String(formData.get("theme") ?? "");
  const colorPalette = String(formData.get("palette") ?? "");
  const colorVariant = String(formData.get("variant") ?? "");
  if (!themes.some(t => t === theme) || !isPalette(colorPalette) ||
    !variants.some(v => v === colorVariant)) throw new Error("Invalid appearance");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      theme: theme as "SYSTEM" | "LIGHT" | "DARK",
      colorPalette,
      colorVariant: colorVariant as "LIGHT" | "STANDARD" | "DARK",
      onboardingCompleted: true,
    },
  });
  redirect("/");
}
