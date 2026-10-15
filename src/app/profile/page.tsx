import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { paletteColors } from "@/lib/appearance";
import { saveAppearance } from "@/app/onboarding/actions";

export default async function Profile() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roleAllows(user.role, "USER")) redirect("/pending");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return <main className="mx-auto max-w-xl space-y-6 p-8">
    <a href="/" className="text-sm underline">Retour à la bibliothèque</a>
    <h1 className="text-3xl font-semibold">Mon profil</h1>
    <div><p className="font-semibold">{user.displayName ?? user.email}</p><p className="text-sm opacity-70">{user.email}</p></div>
    <form action={saveAppearance} className="space-y-5">
      <div><label className="mb-2 block font-semibold" htmlFor="theme">Thème</label>
        <select id="theme" name="theme" defaultValue={user.theme} className="w-full rounded-lg border border-current/20 bg-transparent p-3">
          <option className="text-black" value="SYSTEM">Système</option><option className="text-black" value="LIGHT">Clair</option><option className="text-black" value="DARK">Sombre</option>
        </select></div>
      <fieldset><legend className="mb-2 font-semibold">Palette</legend><div className="grid grid-cols-2 gap-2">
        {Object.entries(paletteColors).map(([name,colors])=><label key={name} className="rounded-lg border border-current/20 p-3 capitalize">
          <input className="mr-2" type="radio" name="palette" value={name} defaultChecked={name===user.colorPalette}/>{name}
          <span className="mt-2 flex overflow-hidden rounded">{colors.map(color=><span key={color} className="h-6 flex-1" style={{backgroundColor:color}}/>)}</span>
        </label>)}
      </div></fieldset>
      <fieldset><legend className="mb-2 font-semibold">Intensité</legend><div className="flex gap-3">
        {["LIGHT","STANDARD","DARK"].map(v=><label key={v} className="rounded-lg border border-current/20 p-3">
          <input className="mr-2" type="radio" name="variant" value={v} defaultChecked={v===user.colorVariant}/>{v==="LIGHT"?"Claire":v==="DARK"?"Foncée":"Standard"}
        </label>)}
      </div></fieldset>
      <button type="submit" className="rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-white">Enregistrer mes préférences</button>
    </form>
  </main>;
}
