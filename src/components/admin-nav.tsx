import Link from "next/link";
export default function AdminNav({ editor = false }: { editor?: boolean }) {
  return <nav aria-label="Administration" className="flex flex-wrap items-center gap-2 text-sm">
    <Link href="/" className="rounded-lg border border-current/15 px-3 py-2 hover:border-[var(--accent)]">Galerie</Link>
    <Link href="/admin/organize" className="rounded-lg border border-current/15 px-3 py-2 hover:border-[var(--accent)]">À organiser</Link>
    {!editor && <><Link href="/admin/users" className="rounded-lg border border-current/15 px-3 py-2 hover:border-[var(--accent)]">Utilisateurs</Link>
    <Link href="/admin/drive" className="rounded-lg border border-current/15 px-3 py-2 hover:border-[var(--accent)]">Google Drive</Link></>}
  </nav>;
}
