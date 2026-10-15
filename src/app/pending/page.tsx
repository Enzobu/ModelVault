import { redirect } from "next/navigation";
import { currentUser, roleAllows } from "@/lib/access";
import { signOut } from "@/auth";

export default async function Pending() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roleAllows(user.role, "USER")) redirect("/");
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-8">
    <h1 className="text-3xl font-semibold">Demande en attente</h1>
    <p>Votre compte a été créé. Un administrateur doit valider votre accès à ModelVault.</p>
    <p className="text-sm opacity-70">{user.email}</p>
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
      <button className="rounded-lg border px-4 py-2" type="submit">Se déconnecter</button>
    </form>
  </main>;
}
