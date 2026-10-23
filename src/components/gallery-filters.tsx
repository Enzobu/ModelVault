"use client";
import Link from "next/link";
import CustomSelect from "@/components/custom-select";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };
type Filters = { query: string; categoryId: string; tagId: string; organization: string; favorites: boolean };
export default function GalleryFilters({ initial, categories, tags,basePath="/" }: { initial: Filters; categories: Option[]; tags: Option[]; basePath?:string }) {
  const router = useRouter();
  const mounted = useRef(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState(initial.categoryId);
  const [tag, setTag] = useState(initial.tagId);
  const [organization, setOrganization] = useState(initial.organization);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim().slice(0, 100));
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (organization) params.set("organization", organization);
      if (basePath === "/favorites") params.set("favorites", "1");
      startTransition(() => router.replace(basePath + (params.size ? "?" + params : ""), { scroll: false }));
    }, query !== initial.query ? 350 : 80);
    return () => window.clearTimeout(timeout);
  }, [query, category, tag, organization, router, initial.query, basePath]);

  return <section aria-label="Filtres de la bibliothèque" className="gallery-controls space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xs font-semibold tracking-wide ui-muted">Filtres</h2>
      <div className="flex items-center gap-3 text-sm">
        <span aria-live="polite" className="ui-muted">{pending ? "Actualisation…" : "Résultats à jour"}</span>
        <Link href={basePath} className="font-semibold text-[var(--accent)] hover:underline" onClick={() => {
          setQuery(""); setCategory(""); setTag(""); setOrganization("");
        }}>Réinitialiser</Link>
      </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <label className="sr-only" htmlFor="filter-query">Rechercher un modèle</label>
      <input id="filter-query" type="search" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Nom du modèle…" maxLength={100}
        className="gallery-search" />
      <CustomSelect label="Catégorie" value={category} onChange={setCategory} options={[{value:"",label:"Toutes les catégories"},...categories.map(v=>({value:v.id,label:v.name}))]}/>
      <CustomSelect label="Tag" value={tag} onChange={setTag} options={[{value:"",label:"Tous les tags"},...tags.map(v=>({value:v.id,label:v.name}))]}/>
      <CustomSelect label="Organisation" value={organization} onChange={setOrganization} options={[{value:"",label:"Tous les statuts"},{value:"organized",label:"Organisés"},{value:"unorganized",label:"À organiser"}]}/>
    </div>
  </section>;
}
