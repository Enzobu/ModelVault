import { prisma } from "@/lib/prisma";
import { driveAccessToken } from "@/lib/drive";

export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  trashed?: boolean;
};

const folderMime = "application/vnd.google-apps.folder";
const formats = new Set(["stl", "3mf", "obj"]);

export function modelFormat(file: Pick<DriveItem, "name" | "mimeType">): string | null {
  if (file.mimeType === folderMime) return null;
  const format = file.name.split(".").pop()?.toLowerCase();
  return format && formats.has(format) ? format : null;
}

export async function listDriveChildren(parentId: string, accessToken: string): Promise<DriveItem[]> {
  const results: DriveItem[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", "'" + parentId.replaceAll("'", "\\'") + "' in parents and trashed = false");
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,size,trashed)");
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Google Drive listing failed (" + response.status + ")");
    const payload = await response.json() as { nextPageToken?: string; files?: DriveItem[] };
    results.push(...(payload.files ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return results;
}

export type IndexStats = { folders: number; models: number; files: number; ignored: number; errors: number };

/** Indexes immediate child folders as models; does not delete or overwrite organization fields. */
export async function indexDriveModels(): Promise<IndexStats> {
  const connection = await prisma.driveConnection.findUnique({
    where: { id: 1 }, select: { rootFolderId: true },
  });
  if (!connection?.rootFolderId) throw new Error("Select a Drive root folder before indexing");
  const token = await driveAccessToken();
  const folders = (await listDriveChildren(connection.rootFolderId, token))
    .filter(item => item.mimeType === folderMime);
  const stats: IndexStats = { folders: folders.length, models: 0, files: 0, ignored: 0, errors: 0 };
  for (const folder of folders) {
    try {
      const children = await listDriveChildren(folder.id, token);
      const files = children.map(item => ({ item, format: modelFormat(item) })).filter(
        (result): result is { item: DriveItem; format: string } => result.format !== null,
      );
      stats.ignored += children.length - files.length;
      await prisma.$transaction(async tx => {
        const model = await tx.model3D.upsert({
          where: { driveFolderId: folder.id },
          create: { driveFolderId: folder.id, driveName: folder.name },
          update: { driveName: folder.name },
          select: { id: true },
        });
        for (const { item, format } of files) {
          await tx.modelFile.upsert({
            where: { googleFileId: item.id },
            create: {
              googleFileId: item.id, filename: item.name, format,
              sizeBytes: item.size ? BigInt(item.size) : null, modelId: model.id,
            },
            update: {
              filename: item.name, format,
              sizeBytes: item.size ? BigInt(item.size) : null, modelId: model.id,
            },
          });
        }
      });
      stats.models++;
      stats.files += files.length;
    } catch (error) {
      stats.errors++;
      console.error("Failed to index Drive folder", folder.id, error instanceof Error ? error.message : "unknown error");
    }
  }
  return stats;
}
