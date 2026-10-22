import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 24;

export function parsePage(raw?: string): number {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
}

export type ModelFilters = { query: string; categoryId: string; tagId: string; organization: string };

export async function listModels(page: number, filters: ModelFilters) {
  const search = filters.query.trim().slice(0, 100);
  const where = {
    removedFromDrive: false,
    isHidden: false,
    ...(search ? { OR: [{ driveName: { contains: search } }, { displayName: { contains: search } }] } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
    ...(filters.organization === "organized" ? { organized: true } : {}),
    ...(filters.organization === "unorganized" ? { organized: false } : {}),
  };
  const [count, models, categories, tags] = await Promise.all([
    prisma.model3D.count({ where }),
    prisma.model3D.findMany({
      where,
      orderBy: [{ driveName: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, driveName: true, displayName: true, organized: true, files: { select: { id: true } }, category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { count, models, categories, tags, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}
