"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };
type Filters = { query: string; categoryId: string; tagId: string; organization: string; favorites: boolean };
export default function GalleryFilters({ initial, categories, tags }: { initial: Filters; categories: Option[]; tags: Option[] }) {
  const router = useRouter();
  const mounted = useRef(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState(initial.categoryId);
  const [tag, setTag] = useState(initial.tagId);
  const [organization, setOrganization] = useState(initial.organization);
  const [favorites, setFavorites] = useState(initial.favorites);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim().slice(0, 100));
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (organization) params.set("organization", organization);
      if (favorites) params.set("favorites", "1");
      startTransition(() => router.replace("/" + (params.size ? "?" + params : ""), { scroll: false }));
    }, query !== initial.query ? 350 : 80);
    return () => window.clearTimeout(timeout);
  }, [query, category, tag, organization, favorites, router, initial.query]);

  return <section aria-label="Filtres de la bibliothèque" className="ui-surface space-y-3 rounded-2xl p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide ui-muted">Affiner la recherche</h2>
      <div className="flex items-center gap-3 text-sm">
        <span aria-live="polite" className="ui-muted">{pending ? "Actualisation…" : "Résultats à jour"}</span>
        <Link href="/" className="font-semibold text-[var(--accent)] hover:underline" onClick={() => {
          setQuery(""); setCategory(""); setTag(""); setOrganization(""); setFavorites(false);
        }}>Réinitialiser</Link>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <label className="sr-only" htmlFor="filter-query">Rechercher un modèle</label>
      <input id="filter-query" type="search" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Nom du modèle…" maxLength={100}
        className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-offset-2" />
      <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Catégorie"
        className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        <option value="">Toutes les catégories</option>{categories.map(v=><option value={v.id} key={v.id}>{v.name}</option>)}
      </select>
      <select value={tag} onChange={e => setTag(e.target.value)} aria-label="Tag"
        className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        <option value="">Tous les tags</option>{tags.map(v=><option value={v.id} key={v.id}>{v.name}</option>)}
      </select>
      <select value={organization} onChange={e => setOrganization(e.target.value)} aria-label="Organisation"
        className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        <option value="">Tous les statuts</option><option value="organized">Organisés</option><option value="unorganized">À organiser</option>
      </select>
    </div>
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium">
      <input type="checkbox" checked={favorites} onChange={e=>setFavorites(e.target.checked)}/> ★ Uniquement mes favoris
    </label>
  </section>;
}
