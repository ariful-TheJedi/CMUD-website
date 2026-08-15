/**
 * Local filesystem helpers for home-page image uploads under `public/media/home/`.
 * Home page *content* is stored in Postgres `page_content` (see page-content.functions.ts).
 * Do not read/write `public/cms/*.json` at runtime.
 *
 * Always targets the permanent project-root `public/` (never `.output/public`).
 * Server-only: do not import from client components.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getMediaDir } from "@/lib/project-paths.server";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);

function homeMediaDir() {
  return getMediaDir("home");
}

/** Only allow deleting CMS uploads we created under /media/home/ (not built-in defaults). */
export function resolveHomeMediaDiskPath(publicUrl: string): string | null {
  if (!publicUrl) return null;
  try {
    const pathname = publicUrl.startsWith("http")
      ? new URL(publicUrl).pathname
      : publicUrl.split("?")[0];
    if (!pathname.startsWith("/media/home/")) return null;
    const name = path.basename(pathname);
    if (!name || name === "." || name === ".." || name.includes("..")) return null;
    if (!/^(hero|hands-on)-\d+\.[a-z0-9]+$/i.test(name)) return null;
    return path.join(homeMediaDir(), name);
  } catch {
    return null;
  }
}

export async function deleteHomeMediaFromPublic(publicUrl: string): Promise<boolean> {
  const diskPath = resolveHomeMediaDiskPath(publicUrl);
  if (!diskPath) return false;
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(diskPath);
    return true;
  } catch {
    return false;
  }
}

export async function saveHomeMediaToPublic(opts: {
  slot: "hero" | "handsOn";
  fileName: string;
  contentType: string;
  base64: string;
  /** Previous public URL to remove when replacing */
  previousUrl?: string;
}): Promise<string> {
  if (!opts.contentType.startsWith("image/")) {
    throw new Error("Only image uploads are allowed");
  }

  const rawExt = (opts.fileName.split(".").pop() || "").toLowerCase();
  const fromType = opts.contentType.split("/")[1]?.split(";")[0]?.toLowerCase() || "jpg";
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : ALLOWED_EXT.has(fromType) ? fromType : "jpg";

  const bytes = Buffer.from(opts.base64, "base64");
  if (bytes.byteLength === 0) throw new Error("Empty file");
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");

  const mediaDir = homeMediaDir();
  await mkdir(mediaDir, { recursive: true });

  const stamp = Date.now();
  const safeSlot = opts.slot === "hero" ? "hero" : "hands-on";
  const diskName = `${safeSlot}-${stamp}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(path.join(mediaDir, diskName), bytes);

  if (opts.previousUrl) {
    await deleteHomeMediaFromPublic(opts.previousUrl);
  }

  return `/media/home/${diskName}`;
}
