import SiteHeader from "@/components/site-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin-nav";

export default async function AdminDashboard() {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (viewer.role !== "ADMIN") redirect("/");
  const [users, pending, models, unorganized, drive, sync] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PENDING" } }),
    prisma.model3D.count({ where: { removedFromDrive: false } }),
    prisma.model3D.count({ where: { organized: false, removedFromDrive: false } }),
    prisma.driveConnection.findUnique({ where: { id: 1 }, select: { rootFolderName: true } }),
    prisma.driveSyncState.findUnique({ where: { id: 1 }, select: { running: true, lastError: true, completedAt: true } }),
  ]);
  const stats = [
    { label: "Modèles indexés", value: models, href: "/" },
    { label: "À organiser", value: unorganized, href: "/admin/organize" },
    { label: "Utilisateurs", value: users, href: "/admin/users" },
    { label: "Accès en attente", value: pending, href: "/admin/users" },
  ];
  return <main className="admin-shell mx-auto max-w-[1500px] space-y-5 px-4 pb-8 sm:px-6 lg:px-8">
    <SiteHeader user={viewer}/>
    <AdminNav />
    <header className="space-y-2"><p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">Administration</p>
      <h1 className="text-3xl font-bold">Tableau de bord</h1><p className="opacity-65">Pilotage de ta bibliothèque ModelVault</p></header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(stat => <Link key={stat.label} href={stat.href} className="rounded-2xl border border-current/10 bg-current/[0.025] p-5 transition hover:border-[var(--accent)]"><p className="text-sm opacity-65">{stat.label}</p><p className="mt-2 text-3xl font-bold">{stat.value}</p></Link>)}</div>
    <section className="space-y-4 rounded-2xl border border-current/10 p-6"><h2 className="text-xl font-semibold">Google Drive</h2>
      <p>Connexion : <strong>{drive ? "Connecté" : "Non connecté"}</strong>{drive?.rootFolderName ? " · " + drive.rootFolderName : ""}</p>
      <p>Synchronisation : {sync?.running ? "En cours" : sync?.lastError ? "Erreur" : "Au repos"}</p>
      <p className="text-sm opacity-65">Dernier passage : {sync?.completedAt?.toLocaleString("fr-FR") ?? "Jamais"}</p>
      {sync?.lastError && <p role="alert" className="text-red-500">{sync.lastError}</p>}
      <Link href="/admin/drive" className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-white">Gérer Google Drive</Link>
    </section>
  </main>;
}
