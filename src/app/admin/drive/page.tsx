import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { disconnectDrive, setRootFolder, requestDriveSync } from "./actions";

export default async function AdminDrive() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  const connection = await prisma.driveConnection.findUnique({
    where: { id: 1 },
    select: { rootFolderId: true, rootFolderName: true, updatedAt: true },
  });
  const sync = await prisma.driveSyncState.findUnique({ where: { id: 1 } });
  return <main className="mx-auto max-w-3xl space-y-8 p-8">
    <Link href="/" className="underline text-sm">Retour</Link>
    <h1 className="text-3xl font-semibold">Google Drive</h1>
    <p className="text-sm opacity-70">Connexion réservée aux administrateurs. Autorisation Drive en lecture seule, indépendante du SSO des utilisateurs.</p>
    {!connection ? <a className="inline-block rounded-lg bg-[var(--accent)] px-5 py-3 text-white" href="/api/admin/drive/connect">Connecter Google Drive</a> :
      <section className="space-y-5">
        <p>Drive connecté. {connection.rootFolderName ? "Dossier : " + connection.rootFolderName : "Sélectionnez le dossier racine."}</p>
        <form action={setRootFolder} className="space-y-3">
          <label htmlFor="folderId" className="block">Identifiant ou URL du dossier racine Drive</label>
          <input id="folderId" name="folderId" required defaultValue={connection.rootFolderId ?? ""} placeholder="https://drive.google.com/drive/folders/..." className="w-full rounded-lg border border-current/20 bg-transparent p-3" />
          <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white" type="submit">Valider ce dossier</button>
        </form>
        <form action={disconnectDrive}><button type="submit" className="rounded-lg border px-4 py-2">Déconnecter Drive</button></form>
      </section>}
    {connection?.rootFolderId && <section className="space-y-3 rounded-xl border border-current/10 p-5">
      <h2 className="text-xl font-semibold">Synchronisation</h2>
      <p>État : {sync?.running ? "En cours" : sync?.requested ? "En attente" : "Au repos"}</p>
      <p>Dernier lancement : {sync?.startedAt?.toLocaleString("fr-FR") ?? "Jamais"}</p>
      <p>Dernier bilan : {sync?.lastResult ?? "Aucun"}</p>
      {sync?.lastError && <p className="text-red-500">Erreur : {sync.lastError}</p>}
      <form action={requestDriveSync}><button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white" type="submit">Synchroniser maintenant</button></form>
      <p className="text-sm opacity-70">Le worker vérifie les demandes toutes les minutes et relance automatiquement une synchronisation environ chaque heure.</p>
    </section>}
  </main>;
}
