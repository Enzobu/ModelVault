import Link from "next/link";
import GalleryFilters from "@/components/gallery-filters";
import ModelThumbnail from "@/components/model-thumbnail";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { listModels, parsePage } from "@/lib/models";
import { signOut } from "@/auth";

type Params = { page?: string; q?: string; category?: string; tag?: string; organization?: string; favorites?: string };
export default async function Home({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roleAllows(user.role, "USER")) redirect("/pending");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const params = await searchParams;
  const page = parsePage(params.page);
  const filters = {
    query: params.q?.trim().slice(0, 100) ?? "",
    categoryId: params.category ?? "",
    tagId: params.tag ?? "",
    organization: params.organization ?? "",
    favorites: params.favorites === "1",
    userId: user.id,
  };
  const { count, models, categories, tags, totalPages } = await listModels(page, filters);
  const hrefFor = (p: number) => "/?" + new URLSearchParams({
    ...(filters.query ? { q: filters.query } : {}),
    ...(filters.categoryId ? { category: filters.categoryId } : {}),
    ...(filters.tagId ? { tag: filters.tagId } : {}),
    ...(filters.organization ? { organization: filters.organization } : {}),
    ...(filters.favorites ? { favorites: "1" } : {}),
    page: String(p),
  }).toString();

  return <main className="mx-auto min-h-screen max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-10">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-current/10 pb-5">
      <Link href="/" className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent)] font-bold text-white">MV</span><span className="text-2xl font-bold tracking-tight">ModelVault</span></Link>
      <nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-3 text-sm sm:gap-5">
        <Link href="/" className="font-semibold">Bibliothèque</Link>
        {roleAllows(user.role, "EDITOR") && <Link href="/admin/organize" className="hover:underline">À organiser</Link>}
        {user.role === "ADMIN" && <Link href="/admin" className="hover:underline">Administration</Link>}
        <Link href="/settings" className="hover:underline">Apparence</Link>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="underline" type="submit">Déconnexion</button></form>
      </nav>
    </header>
    <section className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">Bibliothèque 3D</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore tes modèles</h1>
      <p className="ui-muted">{count} modèles trouvés · STL, 3MF et OBJ</p>
    </section>
    <GalleryFilters initial={filters} categories={categories} tags={tags} />
    <div aria-live="polite" className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Les modèles</h2><span className="text-sm ui-muted">{count} résultat(s)</span></div>
    {models.length === 0 ? <div className="rounded-2xl border border-dashed border-current/20 px-8 py-16 text-center"><h2 className="text-xl font-semibold">Aucun modèle trouvé</h2><p className="mt-2 opacity-65">Modifie les filtres ou synchronise ton Google Drive.</p><Link href="/" className="mt-4 inline-block underline">Effacer les filtres</Link></div> :
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {models.map(model => <li key={model.id}>
          <Link href={"/models/" + encodeURIComponent(model.id)} className="group block h-full overflow-hidden rounded-2xl border border-current/10 bg-[var(--panel)] shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
            {model.files.length > 0 ? <ModelThumbnail modelId={model.id} fileId={(model.files.find(f => f.id === model.previewFileId) ?? model.files[0]).id} format={(model.files.find(f => f.id === model.previewFileId) ?? model.files[0]).format} rotation={[model.previewRotationX, model.previewRotationY, model.previewRotationZ]} zoom={model.previewZoom} /> : <div className="flex aspect-[4/3] items-center justify-center opacity-50">Aucune pièce</div>}
            <div className="space-y-2 p-4">
              <p className="truncate text-lg font-semibold">{model.displayName ?? model.driveName}</p>
              <div className="flex flex-wrap gap-2 text-xs opacity-70"><span>{model.files.length} pièce(s)</span>{model.category && <span>· {model.category.name}</span>}</div>
              <span className={"inline-block rounded-full px-2 py-1 text-xs " + (model.organized ? "bg-current/10" : "border border-[var(--accent)] text-[var(--accent)]")}>{model.organized ? "Organisé" : "À organiser"}</span>
            </div>
          </Link>
        </li>)}
      </ul>}
    <nav aria-label="Pagination" className="flex items-center justify-center gap-6 border-t border-current/10 py-6 text-sm">
      {page > 1 ? <Link href={hrefFor(page - 1)} className="rounded-lg border border-current/20 px-4 py-2 hover:border-[var(--accent)]">Précédent</Link> : <span className="opacity-30">Précédent</span>}
      <span>Page {page} sur {totalPages}</span>
      {page < totalPages ? <Link href={hrefFor(page + 1)} className="rounded-lg border border-current/20 px-4 py-2 hover:border-[var(--accent)]">Suivant</Link> : <span className="opacity-30">Suivant</span>}
    </nav>
  </main>;
}
