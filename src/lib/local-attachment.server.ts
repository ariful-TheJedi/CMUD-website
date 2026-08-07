/**
 * Generic local attachment helpers — write/delete files under
 * `public/attachment/<folder>/`. Server-only.
 */
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ATTACHMENT_ROOT = path.join(ROOT, "public", "attachment");

const ALLOWED_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "zip",
  "rar",
  "7z",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
]);

function attachmentDir(folder: string) {
  return path.join(ATTACHMENT_ROOT, folder);
}

/** Resolve `/attachment/<folder>/file` to a disk path; null if unsafe. */
export function resolvePublicAttachmentDiskPath(
  publicUrl: string,
  folder: string,
  namePattern?: RegExp,
): string | null {
  if (!publicUrl) return null;
  try {
    const pathname = publicUrl.startsWith("http")
      ? new URL(publicUrl).pathname
      : publicUrl.split("?")[0];
    const prefix = `/attachment/${folder}/`;
    if (!pathname.startsWith(prefix)) return null;
    const name = path.basename(pathname);
    if (!name || name === "." || name === ".." || name.includes("..")) return null;
    if (namePattern && !namePattern.test(name)) return null;
    return path.join(attachmentDir(folder), name);
  } catch {
    return null;
  }
}

export async function deletePublicAttachmentFile(
  publicUrl: string,
  folder: string,
  namePattern?: RegExp,
): Promise<boolean> {
  const diskPath = resolvePublicAttachmentDiskPath(publicUrl, folder, namePattern);
  if (!diskPath) return false;
  try {
    await unlink(diskPath);
    return true;
  } catch {
    return false;
  }
}

export async function savePublicAttachmentFile(opts: {
  folder: string;
  filePrefix: string;
  fileName: string;
  contentType: string;
  base64: string;
  previousUrl?: string;
  deletableNamePattern?: RegExp;
  maxBytes?: number;
}): Promise<{ url: string; fileName: string }> {
  const rawExt = (opts.fileName.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT.has(rawExt)) {
    throw new Error(
      `File type ".${rawExt || "?"}" is not allowed. Use PDF, Office, image, or zip.`,
    );
  }

  const bytes = Buffer.from(opts.base64, "base64");
  if (bytes.byteLength === 0) throw new Error("Empty file");
  const max = opts.maxBytes ?? 20 * 1024 * 1024;
  if (bytes.byteLength > max) throw new Error("File must be under 20MB");

  const dir = attachmentDir(opts.folder);
  await mkdir(dir, { recursive: true });

  const prefix = opts.filePrefix.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "file";
  const diskName = `${prefix}-${Date.now()}.${rawExt}`;
  await writeFile(path.join(dir, diskName), bytes);

  if (opts.previousUrl) {
    await deletePublicAttachmentFile(opts.previousUrl, opts.folder, opts.deletableNamePattern);
  }

  return {
    url: `/attachment/${opts.folder}/${diskName}`,
    fileName: opts.fileName,
  };
}
