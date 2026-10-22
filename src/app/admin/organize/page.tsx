import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { bulkOrganize, createCategory, createTag, saveModelOrganization } from "./actions";

export default async function Organize({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (!roleAllows(viewer.role, "EDITOR")) redirect("/");
  const { page: raw } = await searchParams;
  const value = Number(raw);
  const page = Number.isSafeInteger(value) && value > 0 ? Math.min(value, 10000) : 1;
  const where = { organized: false, removedFromDrive: false };
  const [total, models, categories, tags] = await Promise.all([
    prisma.model3D.count({ where }),
    prisma.model3D.findMany({ where, orderBy: { driveName: "asc" }, skip: (page - 1) * 15, take: 15,
      include: { files: { orderBy: { filename: "asc" } }, tags: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <main className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
    <Link href="/" className="underline">Retour à la galerie</Link>
    <header><h1 className="text-3xl font-semibold">À organiser</h1><p className="opacity-70">{total} modèle(s) à classer</p></header>
    <section className="grid gap-4 md:grid-cols-2">
      <form action={createCategory} className="flex gap-2"><input name="name" required maxLength={80} placeholder="Nouvelle catégorie" className="min-w-0 flex-1 rounded-lg border border-current/20 bg-transparent p-3" /><button className="rounded-lg bg-[var(--accent)] px-3 text-white">Ajouter</button></form>
      <form action={createTag} className="flex gap-2"><input name="name" required maxLength={80} placeholder="Nouveau tag" className="min-w-0 flex-1 rounded-lg border border-current/20 bg-transparent p-3" /><button className="rounded-lg bg-[var(--accent)] px-3 text-white">Ajouter</button></form>
    </section>
    <form action={bulkOrganize} className="space-y-3 rounded-xl border border-current/15 p-4">
      <p className="font-semibold">Classement en masse (modèles de la page)</p>
      <div className="flex flex-wrap gap-2">{models.map(m => <label key={m.id} className="flex items-center gap-2 rounded-lg border border-current/15 p-2 text-sm"><input type="checkbox" name="modelIds" value={m.id}/>{m.displayName ?? m.driveName}</label>)}</div>
      <select name="categoryId" aria-label="Catégorie des modèles sélectionnés" className="rounded-lg border border-current/20 bg-transparent p-2"><option value="">Conserver les catégories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <button className="ml-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-white">Marquer comme organisés</button>
    </form>
    <div className="space-y-5">{models.map(model => <form key={model.id} action={saveModelOrganization} className="space-y-4 rounded-2xl border border-current/15 p-5">
      <input type="hidden" name="modelId" value={model.id}/>
      <div><Link className="font-semibold underline" href={"/models/" + model.id}>{model.driveName}</Link><p className="text-sm opacity-60">{model.files.length} fichier(s)</p></div>
      <label className="block text-sm">Nom affiché<input name="displayName" defaultValue={model.displayName ?? ""} placeholder={model.driveName} maxLength={180} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"/></label>
      <label className="block text-sm">Description<textarea name="description" defaultValue={model.description ?? ""} maxLength={3000} rows={2} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"/></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label>Catégorie<select name="categoryId" defaultValue={model.categoryId ?? ""} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"><option value="">Sans catégorie</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Aperçu représentatif<select name="previewFileId" defaultValue={model.previewFileId ?? ""} className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"><option value="">Première pièce</option>{model.files.map(file => <option key={file.id} value={file.id}>{file.filename}</option>)}</select></label>
      </div>
      <fieldset><legend>Tags</legend><div className="flex flex-wrap gap-3">{tags.map(tag => <label key={tag.id} className="text-sm"><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={model.tags.some(t => t.tagId === tag.id)}/>{" "}{tag.name}</label>)}</div></fieldset>
      <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4"><legend>Orientation de l'aperçu (degrés) et zoom</legend>{[["rotationX",model.previewRotationX],["rotationY",model.previewRotationY],["rotationZ",model.previewRotationZ],["zoom",model.previewZoom]].map(([name,value]) => <label key={name} className="text-sm">{name}<input type="number" name={String(name)} defaultValue={Number(value)} step="0.1" className="mt-1 w-full rounded-lg border border-current/20 bg-transparent p-2"/></label>)}</fieldset>
      <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white">Enregistrer et organiser</button>
    </form>)}</div>
    <nav className="flex gap-6"><span>Page {page}</span>{page > 1 && <Link href={"?page=" + (page-1)} className="underline">Précédent</Link>}{page*15 < total && <Link href={"?page=" + (page+1)} className="underline">Suivant</Link>}</nav>
  </main>;
}
