import Link from "next/link";
import GalleryFilters from "@/components/gallery-filters";
import ModelThumbnail from "@/components/model-thumbnail";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { listModels, parsePage } from "@/lib/models";
import SiteHeader from "@/components/site-header";

type Params = { page?: string; q?: string; category?: string; tag?: string; organization?: string; favorites?: string };
export default async function Home({ searchParams, section="library" }: { searchParams: Promise<Params>; section?:"library"|"favorites" }) {
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
    favorites: section === "favorites",
    userId: user.id,
  };
  const { count, models, categories, tags, totalPages } = await listModels(page, filters);
  const basePath=section==="favorites"?"/favorites":"/";
  const hrefFor = (p: number) => basePath+"?" + new URLSearchParams({
    ...(filters.query ? { q: filters.query } : {}),
    ...(filters.categoryId ? { category: filters.categoryId } : {}),
    ...(filters.tagId ? { tag: filters.tagId } : {}),
    ...(filters.organization ? { organization: filters.organization } : {}),
    ...(filters.favorites ? { favorites: "1" } : {}),
    page: String(p),
  }).toString();

  return <main className="mx-auto min-h-screen max-w-[1500px] space-y-5 px-4 pb-8 sm:px-6 lg:px-8">
    <SiteHeader user={user} active={section}/>
    <section className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
      <div><h1 className="text-[22px] font-bold tracking-tight">{section==="favorites"?"Mes favoris":"Tous les modèles"}</h1>
      <p className="text-xs ui-muted">{section==="favorites"?"Retrouve tes modèles enregistrés.":"Explore ta collection de modèles 3D."}</p></div>
      <span className="text-xs ui-muted">{count} modèle{count>1?"s":""}</span>
    </section>
    <GalleryFilters initial={filters} categories={categories} tags={tags} basePath={basePath} />
    
    {models.length === 0 ? <div className="rounded-2xl border border-dashed border-current/20 px-8 py-16 text-center"><h2 className="text-xl font-semibold">Aucun modèle trouvé</h2><p className="mt-2 opacity-65">Modifie les filtres ou synchronise ton Google Drive.</p><Link href="/" className="mt-4 inline-block underline">Effacer les filtres</Link></div> :
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {models.map(model => <li key={model.id}>
          <Link href={"/models/" + encodeURIComponent(model.id)} className="gallery-model-card group">
            {model.files.length > 0 ? <ModelThumbnail modelId={model.id} fileId={(model.files.find(f => f.id === model.previewFileId) ?? model.files[0]).id} format={(model.files.find(f => f.id === model.previewFileId) ?? model.files[0]).format} rotation={[model.previewRotationX, model.previewRotationY, model.previewRotationZ]} zoom={model.previewZoom} /> : <div className="flex aspect-[4/3] items-center justify-center opacity-50">Aucune pièce</div>}
            <div className="space-y-1 px-0.5 pt-2">
              <p className="truncate text-[13px] font-semibold">{model.displayName ?? model.driveName}</p>
              <div className="flex flex-wrap gap-1 text-[11px] ui-muted"><span>{model.files.length} pièce(s)</span>{model.category && <span>· {model.category.name}</span>}</div>
              <span className={"inline-block text-[10px] " + (model.organized ? "ui-muted" : "text-[var(--accent)]")}>{model.organized ? "Organisé" : "À organiser"}</span>
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
