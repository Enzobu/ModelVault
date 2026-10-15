import { signIn } from "@/auth";
export default function Login() {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
    <h1 className="text-3xl font-semibold">Connexion à ModelVault</h1>
    <p>Connectez-vous avec Google. Toute nouvelle inscription nécessite la validation d&apos;un administrateur.</p>
    <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
      <button className="rounded-lg bg-[var(--accent)] px-5 py-3 font-medium text-white" type="submit">Se connecter avec Google</button>
    </form>
  </main>;
}
