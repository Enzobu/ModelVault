import { readdir, statfs } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin-nav";

export const dynamic = "force-dynamic";
function bytes(value: number) { return (value / (1024 * 1024)).toFixed(1) + " Mo"; }
export default async function Diagnostics() {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (viewer.role !== "ADMIN") redirect("/");
  const directory = path.join(process.cwd(), "data", "thumbnails");
  const [models, files, totalSize, thumbnails, disk, sync] = await Promise.all([
    prisma.model3D.count({ where: { removedFromDrive: false } }),
    prisma.modelFile.count(),
    prisma.modelFile.aggregate({ _sum: { sizeBytes: true } }),
    readdir(directory).then(files => files.filter(name => name.endsWith(".png")).length).catch(() => 0),
    statfs(path.join(process.cwd(), "data")).catch(() => null),
    prisma.driveSyncState.findUnique({ where: { id: 1 } }),
  ]);
  const memory = process.memoryUsage();
  let summary: { durationMs?: number; errors?: number; files?: number; models?: number } = {};
  try { summary = JSON.parse(sync?.lastResult ?? "{}"); } catch {}
  const cards = [
    ["Modèles", String(models)],
    ["Fichiers 3D", String(files)],
    ["Taille Drive indexée", bytes(Number(totalSize._sum.sizeBytes ?? 0n))],
    ["Miniatures en cache", String(thumbnails)],
    ["Mémoire serveur RSS", bytes(memory.rss)],
    ["Espace libre du volume", disk ? bytes(disk.bavail * disk.bsize) : "Non disponible"],
    ["Dernière synchro", sync?.completedAt?.toLocaleString("fr-FR") ?? "Jamais"],
    ["Durée de synchro", summary.durationMs == null ? "Non mesurée" : (summary.durationMs / 1000).toFixed(1) + " s"],
  ];
  return <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
    <AdminNav />
    <header><p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Maintenance</p>
      <h1 className="mt-2 text-3xl font-bold">Diagnostics</h1>
      <p className="mt-2 ui-muted">Indicateurs de ton instance ModelVault, accessibles uniquement aux administrateurs.</p>
    </header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([name, value])=>
      <div className="ui-surface rounded-2xl p-5" key={name}><p className="text-xs ui-muted">{name}</p>
        <p className="mt-2 break-words text-xl font-bold">{value}</p></div>)}</div>
    {sync?.lastError && <p role="alert" className="rounded-xl border border-red-400 p-4 text-red-500">{sync.lastError}</p>}
    <section className="ui-surface space-y-2 rounded-2xl p-5">
      <h2 className="font-semibold">Limites des indicateurs</h2>
      <p className="text-sm ui-muted">La mémoire est celle du processus Next.js ; les consommations Docker complètes (CPU, réseau, disque et base MariaDB) doivent aussi être surveillées sur l'hôte.</p>
      <p className="text-sm ui-muted">Le volume affiché correspond au montage de données. Les tailles Drive sont celles des métadonnées indexées.</p>
    </section>
  </main>;
}
