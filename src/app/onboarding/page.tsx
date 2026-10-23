import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { paletteColors } from "@/lib/appearance";
import { saveAppearance } from "./actions";
import SegmentedChoice from "@/components/segmented-choice";
import PalettePicker from "@/components/palette-picker";

export default async function Onboarding() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roleAllows(user.role,"USER")) redirect("/pending");
  if (user.onboardingCompleted) redirect("/");
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
    <h1 className="text-3xl font-semibold">Bienvenue sur ModelVault</h1>
    <p>Personnalisez votre espace. Tous ces choix seront modifiables plus tard dans votre profil.</p>
    <form action={saveAppearance} className="ui-surface space-y-6 rounded-xl p-5">
      <SegmentedChoice name="theme" label="Thème" defaultValue="SYSTEM" options={[["SYSTEM","Système"],["LIGHT","Clair"],["DARK","Sombre"]]}/>
      <PalettePicker palettes={paletteColors} defaultValue="cuivre"/>
      <SegmentedChoice name="variant" label="Intensité" defaultValue="STANDARD" options={[["LIGHT","Claire"],["STANDARD","Normale"],["DARK","Foncée"]]}/>
      <button type="submit" className="w-full rounded-xl bg-[var(--accent)] p-3 font-medium text-white">Commencer</button>
    </form>
  </main>;
}
