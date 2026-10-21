import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { signOut } from "@/auth";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roleAllows(user.role, "USER")) redirect("/pending");
  if (!user.onboardingCompleted) redirect("/onboarding");
  return <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6">
    <h1 className="text-3xl font-semibold">ModelVault</h1>
    <p>Bienvenue {user.displayName ?? user.email}. Votre bibliothèque est en préparation.</p>
    <p className="text-sm opacity-70">Rôle : {user.role}</p>
    {user.role === "ADMIN" && <><a href="/admin/users" className="underline">Administrer les utilisateurs</a><a href="/admin/drive" className="underline">Configurer Google Drive</a></>}
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
      <button type="submit" className="rounded-lg border px-4 py-2">Se déconnecter</button>
    </form>
  </main>;
}
