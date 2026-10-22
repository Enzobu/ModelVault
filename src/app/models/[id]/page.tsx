import Link from "next/link";
import ModelViewer from "@/components/model-viewer";
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
    include: { files: { orderBy: { filename: "asc" } }, category: true, tags: { include: { tag: true } } },
  });
  if (!model) notFound();

  return <main className="mx-auto max-w-5xl space-y-7 px-6 py-10">
    <Link href="/" className="underline underline-offset-4">Retour à la galerie</Link>
    <div className="space-y-2">
      <p className="text-sm opacity-70">{model.organized ? "Organisé" : "À organiser"}</p>
      <h1 className="break-words text-3xl font-semibold">{model.displayName ?? model.driveName}</h1>
      {model.category && <p className="opacity-70">Catégorie : {model.category.name}</p>}
      {model.description && <p className="whitespace-pre-wrap">{model.description}</p>}
      {model.tags.length > 0 && <p className="text-sm opacity-70">Tags : {model.tags.map(({ tag }) => tag.name).join(", ")}</p>}
    </div>
    {model.files.length > 0 && <section className="space-y-3"><h2 className="text-xl font-semibold">Aperçu 3D</h2><ModelViewer key={model.files[0].id} src={"/api/models/" + model.id + "/files/" + model.files[0].id + "/content"} format={model.files[0].format} /></section>}
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
