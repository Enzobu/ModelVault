import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { currentUser } from "@/lib/access";
import { paletteColors, isPalette } from "@/lib/appearance";
import "./globals.css";

export const metadata: Metadata = { title: "ModelVault", description: "Médiathèque de modèles 3D" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const palette = user && isPalette(user.colorPalette) ? user.colorPalette : "cuivre";
  const intensity = user?.colorVariant === "LIGHT" ? 0 : user?.colorVariant === "DARK" ? 2 : 1;
  const accent = paletteColors[palette][intensity];
  const style = { "--accent": accent } as CSSProperties;
  return <html lang="fr" data-theme={(user?.theme ?? "SYSTEM").toLowerCase()} style={style}>
    <body>{children}</body>
  </html>;
}
