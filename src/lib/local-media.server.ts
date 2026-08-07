/**
 * Generic local media helpers — write/delete files under `public/media/<folder>/`.
 * Server-only: do not import from client components.
 */
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const MEDIA_ROOT = path.join(ROOT, "public", "media");
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);

function mediaDir(folder: string) {
  return path.join(MEDIA_ROOT, folder);
}

/** Resolve a `/media/<folder>/file` URL to a disk path; null if unsafe / not local. */
export function resolvePublicMediaDiskPath(
  publicUrl: string,
  folder: string,
  /** Optional filename pattern that must match (e.g. CMS uploads only). */
  namePattern?: RegExp,
): string | null {
  if (!publicUrl) return null;
  try {
    const pathname = publicUrl.startsWith("http")
      ? new URL(publicUrl).pathname
      : publicUrl.split("?")[0];
    const prefix = `/media/${folder}/`;
    if (!pathname.startsWith(prefix)) return null;
    const name = path.basename(pathname);
    if (!name || name === "." || name === ".." || name.includes("..")) return null;
    if (namePattern && !namePattern.test(name)) return null;
    return path.join(mediaDir(folder), name);
  } catch {
    return null;
  }
}

export async function deletePublicMediaFile(
  publicUrl: string,
  folder: string,
  namePattern?: RegExp,
): Promise<boolean> {
  const diskPath = resolvePublicMediaDiskPath(publicUrl, folder, namePattern);
  if (!diskPath) return false;
  try {
    await unlink(diskPath);
    return true;
  } catch {
    return false;
  }
}

export async function savePublicMediaFile(opts: {
  folder: string;
  /** Prefix for generated filename, e.g. "hero" or "faculty-name" */
  filePrefix: string;
  fileName: string;
  contentType: string;
  base64: string;
  previousUrl?: string;
  /** Pattern of previous uploads that are safe to delete */
  deletableNamePattern?: RegExp;
  maxBytes?: number;
}): Promise<string> {
  if (!opts.contentType.startsWith("image/")) {
    throw new Error("Only image uploads are allowed");
  }

  const rawExt = (opts.fileName.split(".").pop() || "").toLowerCase();
  const fromType = opts.contentType.split("/")[1]?.split(";")[0]?.toLowerCase() || "jpg";
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : ALLOWED_EXT.has(fromType) ? fromType : "jpg";

  const bytes = Buffer.from(opts.base64, "base64");
  if (bytes.byteLength === 0) throw new Error("Empty file");
  const max = opts.maxBytes ?? 5 * 1024 * 1024;
  if (bytes.byteLength > max) throw new Error(`Image must be under ${Math.round(max / (1024 * 1024))}MB`);

  const dir = mediaDir(opts.folder);
  await mkdir(dir, { recursive: true });

  const prefix = opts.filePrefix.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "file";
  const diskName = `${prefix}-${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(path.join(dir, diskName), bytes);

  if (opts.previousUrl) {
    await deletePublicMediaFile(opts.previousUrl, opts.folder, opts.deletableNamePattern);
  }

  return `/media/${opts.folder}/${diskName}`;
}
