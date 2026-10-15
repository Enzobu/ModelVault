import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { setUserRole } from "./actions";

export default async function AdminUsers() {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (viewer.role !== "ADMIN") redirect("/");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  return <main className="mx-auto max-w-4xl space-y-8 p-8">
    <div><Link className="text-sm underline" href="/">Retour</Link><h1 className="mt-5 text-3xl font-semibold">Utilisateurs</h1>
      <p className="opacity-70">{users.filter(u => u.role === "PENDING").length} demande(s) en attente</p></div>
    <div className="space-y-4">
      {users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-current/10 p-4">
        <div><p className="font-semibold">{user.displayName ?? user.email}</p><p className="text-sm opacity-70">{user.email} · {user.role}</p></div>
        <form action={setUserRole} className="flex flex-wrap gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <select name="role" defaultValue={user.role} className="rounded-lg border border-current/20 bg-transparent px-3 py-2" aria-label={"Rôle de " + user.email}>
            {["PENDING","USER","EDITOR","ADMIN"].map(role => <option key={role} value={role} className="text-black">{role}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white">Enregistrer</button>
        </form>
      </div>)}
    </div>
  </main>;
}
