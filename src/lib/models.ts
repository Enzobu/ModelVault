import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 24;

export function parsePage(raw?: string): number {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
}

export async function listModels(page: number, query: string) {
  const search = query.trim().slice(0, 100);
  const where = {
    removedFromDrive: false,
    isHidden: false,
    ...(search ? { OR: [{ driveName: { contains: search } }, { displayName: { contains: search } }] } : {}),
  };
  const [count, models] = await Promise.all([
    prisma.model3D.count({ where }),
    prisma.model3D.findMany({
      where,
      orderBy: [{ driveName: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, driveName: true, displayName: true, organized: true, files: { select: { id: true } } },
    }),
  ]);
  return { count, models, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}
