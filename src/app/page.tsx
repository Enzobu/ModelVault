import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { listModels, parsePage } from "@/lib/models";
import { signOut } from "@/auth";

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roleAllows(user.role, "USER")) redirect("/pending");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const { page: rawPage, q: rawQuery } = await searchParams;
  const page = parsePage(rawPage);
  const query = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 100) : "";
  const { count, models, totalPages } = await listModels(page, query);
  const hrefFor = (p: number) => "/?" + new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) }).toString();

  return <main className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
    <header className="flex flex-wrap items-center justify-between gap-5">
      <div><h1 className="text-3xl font-semibold">ModelVault</h1><p className="text-sm opacity-70">{count} modèles disponibles</p></div>
      <nav className="flex flex-wrap gap-4 text-sm">
        {user.role === "ADMIN" && <><Link href="/admin/users" className="underline">Utilisateurs</Link><Link href="/admin/drive" className="underline">Google Drive</Link></>}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="underline" type="submit">Déconnexion</button></form>
      </nav>
    </header>
    <form action="/" method="GET" className="flex flex-wrap gap-3">
      <input aria-label="Rechercher un modèle" name="q" defaultValue={query} placeholder="Rechercher un modèle..." maxLength={100}
        className="min-w-60 flex-1 rounded-xl border border-current/20 bg-transparent px-4 py-3" />
      <button type="submit" className="rounded-xl bg-[var(--accent)] px-5 py-3 text-white">Rechercher</button>
    </form>
    {models.length === 0 ? <p className="rounded-xl border border-current/15 p-8 opacity-70">Aucun modèle trouvé. {query ? "Essayez une autre recherche." : "Lancez une synchronisation Drive depuis l’administration."}</p> :
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {models.map(model => <li key={model.id}>
          <Link href={"/models/" + encodeURIComponent(model.id)} className="block h-full rounded-2xl border border-current/15 p-5 transition-colors hover:bg-current/5">
            <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-xl bg-current/5 text-sm opacity-60">Aperçu à venir</div>
            <h2 className="break-words font-semibold">{model.displayName ?? model.driveName}</h2>
            <p className="mt-2 text-sm opacity-70">{model.files.length} pièce(s) · {model.organized ? "Organisé" : "À organiser"}</p>
          </Link>
        </li>)}
      </ul>}
    <nav aria-label="Pagination" className="flex items-center justify-center gap-5">
      {page > 1 ? <Link href={hrefFor(page - 1)} className="underline">Précédent</Link> : <span className="opacity-30">Précédent</span>}
      <span>Page {page} / {totalPages}</span>
      {page < totalPages ? <Link href={hrefFor(page + 1)} className="underline">Suivant</Link> : <span className="opacity-30">Suivant</span>}
    </nav>
  </main>;
}
