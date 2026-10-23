import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { paletteColors } from "@/lib/appearance";
import { saveAppearance } from "@/app/onboarding/actions";
import { saveProfile, uploadAvatar, resetAvatar } from "./actions";
import { signOut } from "@/auth";
import SiteHeader from "@/components/site-header";
import ProfileAvatar from "@/components/profile-avatar";
import SegmentedChoice from "@/components/segmented-choice";
import PalettePicker from "@/components/palette-picker";

export default async function Profile() {
  const user=await currentUser();
  if(!user)redirect("/login");
  if(!roleAllows(user.role,"USER"))redirect("/pending");
  if(!user.onboardingCompleted)redirect("/onboarding");
  return <main className="mx-auto min-h-screen max-w-[1500px] px-4 sm:px-6 lg:px-8">
    <SiteHeader user={user} active="profile"/>
    <div className="mx-auto max-w-3xl space-y-6 py-7">
      <div><h1 className="text-2xl font-bold">Mon profil</h1><p className="text-sm ui-muted">Informations personnelles et personnalisation.</p></div>
      <section className="ui-surface space-y-5 rounded-xl p-5">
        <h2 className="text-base font-semibold">Photo et informations</h2>
        <div className="flex flex-wrap items-center gap-4"><ProfileAvatar user={user} size={72}/>
          <div><p className="font-semibold">{user.displayName??"Compte Google"}</p><p className="text-xs ui-muted">{user.email}</p><p className="mt-1 text-xs ui-muted">Photo Google par défaut, ou image personnalisée.</p></div>
        </div>
        <form action={uploadAvatar} className="flex flex-wrap items-center gap-2">
          <input aria-label="Choisir une photo de profil" type="file" name="avatar" accept="image/png,image/jpeg,image/webp" required className="max-w-full text-xs"/>
          <button type="submit" className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">Changer ma photo</button>
        </form>
        {user.avatarCustom&&<form action={resetAvatar}><button type="submit" className="text-xs text-[var(--accent)] hover:underline">Revenir à la photo Google</button></form>}
        <form action={saveProfile} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[220px] flex-1 text-xs font-medium">Nom affiché<input name="displayName" required minLength={2} maxLength={90} defaultValue={user.displayName??""} className="mt-1 block h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"/></label>
          <button type="submit" className="h-9 rounded-md border border-[var(--border)] px-3 text-xs font-semibold">Enregistrer</button>
        </form>
        <p className="text-xs ui-muted">L’adresse email est gérée par ton compte Google.</p>
      </section>
      <section className="ui-surface space-y-4 rounded-xl p-5">
        <h2 className="text-base font-semibold">Apparence</h2>
        <form action={saveAppearance} className="space-y-4">
          <SegmentedChoice name="theme" label="Thème" defaultValue={user.theme} options={[["SYSTEM","Système"],["LIGHT","Clair"],["DARK","Sombre"]]}/>
          <PalettePicker palettes={paletteColors} defaultValue={user.colorPalette}/>
          <SegmentedChoice name="variant" label="Intensité" defaultValue={user.colorVariant} options={[["LIGHT","Claire"],["STANDARD","Normale"],["DARK","Foncée"]]}/>
          <button className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">Enregistrer l’apparence</button>
        </form>
      </section>
      <section className="ui-surface flex items-center justify-between rounded-xl p-5"><div><h2 className="text-sm font-semibold">Session</h2><p className="text-xs ui-muted">Se déconnecter de ModelVault</p></div>
        <form action={async()=>{"use server";await signOut({redirectTo:"/login"});}}><button type="submit" className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold">Déconnexion</button></form>
      </section>
      <Link href="/" className="text-xs ui-muted hover:underline">← Retour à la bibliothèque</Link>
    </div>
  </main>;
}
