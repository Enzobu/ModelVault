import Link from "next/link";
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
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Fichiers ({model.files.length})</h2>
      {model.files.length === 0 ? <p className="opacity-70">Aucun fichier 3D indexé dans ce dossier.</p> :
        <ul className="space-y-3">{model.files.map(file =>
          <li key={file.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-current/15 p-4">
            <span className="break-all">{file.filename}</span>
            <span className="text-sm uppercase opacity-70">{file.format} {file.sizeBytes == null ? "" : "· " + (Number(file.sizeBytes) / (1024 * 1024)).toFixed(2) + " Mo"}</span>
          </li>)}</ul>}
    </section>
    <p className="text-sm opacity-60">L’aperçu 3D et les téléchargements arrivent dans les prochains tickets.</p>
  </main>;
}
