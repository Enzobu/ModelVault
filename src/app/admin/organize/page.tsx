import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import SubmitButton from "@/components/submit-button";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { bulkOrganize, createCategory, createTag, saveModelOrganization } from "./actions";

export default async function Organize({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; q?: string }> }) {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (!roleAllows(viewer.role, "EDITOR")) redirect("/");
  const { page: raw, view: rawView, q: rawQuery } = await searchParams;
  const view = rawView === "all" ? "all" : "pending";
  const query = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 100) : "";
  const value = Number(raw);
  const page = Number.isSafeInteger(value) && value > 0 ? Math.min(value, 10000) : 1;
  const where = { removedFromDrive: false, ...(view === "pending" ? { organized: false } : {}),
    ...(query ? { OR: [{ driveName: { contains: query } }, { displayName: { contains: query } }] } : {}) };
  const [total, models, categories, tags] = await Promise.all([
    prisma.model3D.count({ where }),
    prisma.model3D.findMany({ where, orderBy: { driveName: "asc" }, skip: (page - 1) * 15, take: 15,
      include: { files: { orderBy: { filename: "asc" } }, tags: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <main className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
    <AdminNav editor={viewer.role !== "ADMIN"} />
    <header className="space-y-2"><h1 className="text-3xl font-semibold">Gérer les modèles</h1><p className="ui-muted">{total} modèle(s) dans cette vue</p></header>
    <nav aria-label="Vues des modèles" className="flex flex-wrap gap-3">
      <Link href="/admin/organize" className={"rounded-xl border px-4 py-2 " + (view === "pending" ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)]")}>À organiser</Link>
      <Link href="/admin/organize?view=all" className={"rounded-xl border px-4 py-2 " + (view === "all" ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)]")}>Tous les modèles</Link>
    </nav>
    <form method="GET" className="flex flex-wrap gap-2">
      {view === "all" && <input type="hidden" name="view" value="all" />}
      <input name="q" defaultValue={query} placeholder="Rechercher un modèle à modifier…" maxLength={100}
        className="min-w-48 flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3" aria-label="Rechercher dans les modèles" />
      <button className="rounded-xl bg-[var(--accent)] px-5 py-2 font-semibold text-white">Rechercher</button>
    </form>
    <section className="grid gap-4 md:grid-cols-2">
      <form action={createCategory} className="flex gap-2"><input name="name" required maxLength={80} placeholder="Nouvelle catégorie" className="min-w-0 flex-1 rounded-lg border border-current/20 bg-transparent p-3" /><SubmitButton className="rounded-lg bg-[var(--accent)] px-3 text-white">Ajouter</SubmitButton></form>
      <form action={createTag} className="flex gap-2"><input name="name" required maxLength={80} placeholder="Nouveau tag" className="min-w-0 flex-1 rounded-lg border border-current/20 bg-transparent p-3" /><button className="rounded-lg bg-[var(--accent)] px-3 text-white">Ajouter</button></form>
    </section>
    <form action={bulkOrganize} className="space-y-3 rounded-xl border border-current/15 p-4">
      <p className="font-semibold">Classement en masse (modèles de la page)</p>
      <div className="flex flex-wrap gap-2">{models.map(m => <label key={m.id} className="flex items-center gap-2 rounded-lg border border-current/15 p-2 text-sm"><input type="checkbox" name="modelIds" value={m.id}/>{m.displayName ?? m.driveName}</label>)}</div>
      <select name="categoryId" aria-label="Catégorie des modèles sélectionnés" className="rounded-lg border border-current/20 bg-transparent p-2"><option value="">Conserver les catégories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <SubmitButton className="ml-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-white">Marquer comme organisés</SubmitButton>
    </form>
    <div className="space-y-3">{models.map(model => <details key={model.id} className="ui-surface group rounded-2xl">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0"><p className="truncate font-semibold">{model.displayName ?? model.driveName}</p><p className="text-xs ui-muted">{model.files.length} fichier(s) · {model.organized ? "Organisé" : "À organiser"}</p></div>
        <span className="shrink-0 text-sm font-semibold text-[var(--accent)]">Modifier <span className="inline-block transition-transform group-open:rotate-180">⌄</span></span>
      </summary>
      <form action={saveModelOrganization} className="space-y-4 border-t border-[var(--border)] p-4 sm:p-5">
      <input type="hidden" name="modelId" value={model.id}/>
      <div><Link className="font-semibold underline" href={"/models/" + model.id}>{model.driveName}</Link><p className="text-sm opacity-60">{model.files.length} fichier(s)</p></div>
      <label className="block text-sm">Nom affiché<input name="displayName" defaultValue={model.displayName ?? ""} placeholder={model.driveName} maxLength={180} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"/></label>
      <label className="block text-sm">Description<textarea name="description" defaultValue={model.description ?? ""} maxLength={3000} rows={2} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"/></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label>Catégorie<select name="categoryId" defaultValue={model.categoryId ?? ""} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"><option value="">Sans catégorie</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Aperçu représentatif<select name="previewFileId" defaultValue={model.previewFileId ?? ""} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"><option value="">Première pièce</option>{model.files.map(file => <option key={file.id} value={file.id}>{file.filename}</option>)}</select></label>
      </div>
      <fieldset><legend>Tags</legend><div className="flex flex-wrap gap-3">{tags.map(tag => <label key={tag.id} className="text-sm"><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={model.tags.some(t => t.tagId === tag.id)}/>{" "}{tag.name}</label>)}</div></fieldset>
      <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4"><legend>Orientation de l&apos;aperçu (degrés) et zoom</legend>{[["rotationX",model.previewRotationX],["rotationY",model.previewRotationY],["rotationZ",model.previewRotationZ],["zoom",model.previewZoom]].map(([name,value]) => <label key={name} className="text-sm">{name}<input type="number" name={String(name)} defaultValue={Number(value)} step="0.1" className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"/></label>)}</fieldset>
      <SubmitButton className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white">Enregistrer le modèle</SubmitButton>
    </form></details>)}</div>
    <nav aria-label="Pagination" className="flex items-center justify-center gap-5 text-sm">
      {page > 1 && <Link href={"/admin/organize?" + new URLSearchParams({ ...(view === "all" ? { view } : {}), ...(query ? { q:query } : {}), page:String(page-1) })} className="underline">Précédent</Link>}
      <span>Page {page} / {Math.max(1, Math.ceil(total/15))}</span>
      {page*15 < total && <Link href={"/admin/organize?" + new URLSearchParams({ ...(view === "all" ? { view } : {}), ...(query ? { q:query } : {}), page:String(page+1) })} className="underline">Suivant</Link>}
    </nav>
  </main>;
}
