import SiteHeader from "@/components/site-header";
import Link from "next/link";
import ModelViewer from "@/components/model-viewer";
import SubmitButton from "@/components/submit-button";
import OpenInCura from "@/components/open-in-cura";
import { toggleFavorite } from "./favorite-actions";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser, roleAllows } from "@/lib/access";

export default async function ModelDetail({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (!roleAllows(viewer.role, "USER")) redirect("/pending");
  if (!viewer.onboardingCompleted) redirect("/onboarding");

  const { id } = await params;
  const model = await prisma.model3D.findFirst({
    where: { id, isHidden: false, removedFromDrive: false },
    include: { files: { orderBy: { filename: "asc" } }, category: true, tags: { include: { tag: true } }, favorites: { where: { userId: viewer.id }, select: { userId: true } } },
  });
  if (!model) notFound();

  return <main className="model-detail-shell mx-auto max-w-[1500px] space-y-5 px-4 pb-8 sm:px-6 lg:px-8">
    <SiteHeader user={viewer}/>
    <Link href="/" className="underline underline-offset-4">Retour à la galerie</Link>
    <div className="space-y-2">
      <p className="text-sm opacity-70">{model.organized ? "Organisé" : "À organiser"}</p>
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="break-words text-3xl font-semibold">{model.displayName ?? model.driveName}</h1>
        <form action={toggleFavorite}><input type="hidden" name="modelId" value={model.id}/><SubmitButton className="rounded-xl border border-[var(--border)] px-4 py-2 hover:border-[var(--accent)]">{model.favorites.length ? "★ Dans mes favoris" : "☆ Ajouter aux favoris"}</SubmitButton></form>
      </div>
      {model.category && <p className="opacity-70">Catégorie : {model.category.name}</p>}
      {model.description && <p className="whitespace-pre-wrap">{model.description}</p>}
      {model.tags.length > 0 && <p className="text-sm opacity-70">Tags : {model.tags.map(({ tag }) => tag.name).join(", ")}</p>}
    </div>
    {model.files.length > 0 && <section className="space-y-3 ui-surface rounded-2xl p-4 sm:p-6"><h2 className="text-xl font-semibold">Aperçu 3D</h2><ModelViewer key={(model.files.find(file => file.id === model.previewFileId) ?? model.files[0]).id} src={"/api/models/" + model.id + "/files/" + (model.files.find(file => file.id === model.previewFileId) ?? model.files[0]).id + "/content"} format={(model.files.find(file => file.id === model.previewFileId) ?? model.files[0]).format} rotation={[model.previewRotationX, model.previewRotationY, model.previewRotationZ]} zoom={model.previewZoom} /></section>}
    {model.files.length > 0 && <OpenInCura modelId={model.id} />}
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Fichiers ({model.files.length})</h2>{model.files.length > 0 && <a className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white" href={"/api/models/" + model.id + "/download"}>Télécharger le ZIP</a>}</div>
      {model.files.length === 0 ? <p className="opacity-70">Aucun fichier 3D indexé dans ce dossier.</p> :
        <ul className="space-y-3">{model.files.map(file =>
          <li key={file.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-current/15 p-4">
            <span className="break-all">{file.filename}</span>
            <div className="flex items-center gap-4"><span className="text-sm uppercase opacity-70">{file.format} {file.sizeBytes == null ? "" : "· " + (Number(file.sizeBytes) / (1024 * 1024)).toFixed(2) + " Mo"}</span><a className="underline" href={"/api/models/" + model.id + "/files/" + file.id + "/content?download=1"}>Télécharger</a></div>
          </li>)}</ul>}
    </section>

  </main>;
}
