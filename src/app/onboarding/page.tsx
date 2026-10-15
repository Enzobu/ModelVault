import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { paletteColors } from "@/lib/appearance";
import { saveAppearance } from "./actions";

export default async function Onboarding() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roleAllows(user.role,"USER")) redirect("/pending");
  if (user.onboardingCompleted) redirect("/");
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
    <h1 className="text-3xl font-semibold">Bienvenue sur ModelVault</h1>
    <p>Personnalisez votre espace. Tous ces choix seront modifiables plus tard dans votre profil.</p>
    <form action={saveAppearance} className="space-y-6">
      <fieldset className="space-y-2"><legend className="font-semibold">Thème</legend>
        <div className="grid grid-cols-3 gap-2">
          {["SYSTEM","LIGHT","DARK"].map((v,i)=><label key={v} className="rounded-lg border border-current/20 p-3 text-center"><input className="mr-1" type="radio" name="theme" value={v} defaultChecked={i===0}/>{["Système","Clair","Sombre"][i]}</label>)}
        </div></fieldset>
      <fieldset className="space-y-2"><legend className="font-semibold">Palette</legend>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(paletteColors).map(([key,colors])=><label key={key} className="rounded-lg border border-current/20 p-3 capitalize">
            <input className="mr-2" type="radio" name="palette" value={key} defaultChecked={key==="cuivre"}/>{key}
            <span className="mt-2 flex overflow-hidden rounded-md">{colors.map(color=><span key={color} className="h-7 flex-1" style={{backgroundColor:color}}/>)}</span>
          </label>)}
        </div></fieldset>
      <fieldset className="space-y-2"><legend className="font-semibold">Intensité</legend>
        <div className="grid grid-cols-3 gap-2">{["LIGHT","STANDARD","DARK"].map((v,i)=><label key={v} className="rounded-lg border border-current/20 p-3 text-center"><input type="radio" className="mr-1" name="variant" value={v} defaultChecked={i===1}/>{["Claire","Standard","Foncée"][i]}</label>)}</div>
      </fieldset>
      <button type="submit" className="w-full rounded-xl bg-[var(--accent)] p-3 font-medium text-white">Commencer</button>
    </form>
  </main>;
}
