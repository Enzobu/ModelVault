import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { paletteColors } from "@/lib/appearance";
import { saveAppearance } from "@/app/onboarding/actions";

export default async function Settings() {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (!roleAllows(viewer.role, "USER")) redirect("/pending");
  return <main className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-8">
    <Link href="/" className="text-sm underline">← Bibliothèque</Link>
    <header><p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Personnalisation</p>
      <h1 className="mt-2 text-3xl font-bold">Apparence</h1>
      <p className="mt-1 ui-muted">Retrouve la même palette sur la galerie, les fiches et l'administration.</p></header>
    <form action={saveAppearance} className="ui-surface space-y-7 rounded-2xl p-5 sm:p-7">
      <fieldset className="space-y-3"><legend className="font-semibold">Thème</legend>
        <div className="grid grid-cols-3 gap-2">{[["SYSTEM","Système"],["LIGHT","Clair"],["DARK","Sombre"]].map(([value,title]) =>
          <label key={value} className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-3 text-sm">
            <input type="radio" name="theme" value={value} defaultChecked={viewer.theme===value}/>{title}</label>)}</div>
      </fieldset>
      <fieldset className="space-y-3"><legend className="font-semibold">Palette</legend>
        <div className="grid gap-3 sm:grid-cols-2">{Object.entries(paletteColors).map(([name,colors]) =>
          <label key={name} className="rounded-xl border border-[var(--border)] p-3">
            <span className="flex items-center gap-2 capitalize"><input type="radio" name="palette" value={name} defaultChecked={viewer.colorPalette===name}/>{name}</span>
            <span className="mt-2 flex overflow-hidden rounded-lg">{colors.map(color => <span key={color} className="h-8 flex-1" style={{background:color}}/>)}</span>
          </label>)}</div>
      </fieldset>
      <fieldset className="space-y-3"><legend className="font-semibold">Intensité</legend>
        <div className="grid grid-cols-3 gap-2">{[["LIGHT","Claire"],["STANDARD","Normale"],["DARK","Foncée"]].map(([value,label]) =>
          <label key={value} className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-3 text-sm">
            <input type="radio" name="variant" value={value} defaultChecked={viewer.colorVariant===value}/>{label}</label>)}</div>
      </fieldset>
      <button className="w-full rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white hover:brightness-110">Enregistrer mes préférences</button>
    </form>
  </main>;
}
