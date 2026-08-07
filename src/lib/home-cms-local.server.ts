/**
 * Local (filesystem) home CMS store — used so home page editing works
 * without Supabase Storage / DB. Files live under `public/` and are
 * served by Vite as static assets.
 *
 * Server-only: do not import from client components.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultHomeContent,
  normalizeHomeContent,
  type HomePageContent,
} from "@/lib/home-content";

export type LocalHomeCmsRecord = {
  id: string;
  title: string;
  slug: "home";
  metaTitle: string;
  metaDescription: string;
  pageData: HomePageContent;
  updatedAt: string;
};

export type LocalHomeCmsInput = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  pageData: HomePageContent;
};

const ROOT = process.cwd();
const CMS_DIR = path.join(ROOT, "public", "cms");
const CMS_FILE = path.join(CMS_DIR, "home.json");
const MEDIA_DIR = path.join(ROOT, "public", "media", "home");

type StoredFile = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  pageData: HomePageContent;
  updatedAt: string;
};

function toRecord(data: StoredFile): LocalHomeCmsRecord {
  return {
    id: "local-home",
    title: data.title,
    slug: "home",
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    pageData: normalizeHomeContent(data.pageData),
    updatedAt: data.updatedAt,
  };
}

export async function readLocalHomeCms(): Promise<LocalHomeCmsRecord | null> {
  try {
    const raw = await readFile(CMS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredFile>;
    return toRecord({
      title: parsed.title || "Home Page",
      metaTitle: parsed.metaTitle || "",
      metaDescription: parsed.metaDescription || "",
      pageData: normalizeHomeContent(parsed.pageData),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

export async function writeLocalHomeCms(input: LocalHomeCmsInput): Promise<LocalHomeCmsRecord> {
  await mkdir(CMS_DIR, { recursive: true });
  const record: StoredFile = {
    title: input.title?.trim() || "Home Page",
    metaTitle: input.metaTitle?.trim() || "",
    metaDescription: input.metaDescription?.trim() || "",
    pageData: normalizeHomeContent(input.pageData),
    updatedAt: new Date().toISOString(),
  };
  await writeFile(CMS_FILE, JSON.stringify(record, null, 2), "utf8");
  return toRecord(record);
}

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);

/** Only allow deleting CMS uploads we created under /media/home/ (not built-in defaults). */
export function resolveHomeMediaDiskPath(publicUrl: string): string | null {
  if (!publicUrl) return null;
  try {
    // Accept absolute or relative URLs that point at our local media folder.
    const pathname = publicUrl.startsWith("http")
      ? new URL(publicUrl).pathname
      : publicUrl.split("?")[0];
    if (!pathname.startsWith("/media/home/")) return null;
    const name = path.basename(pathname);
    if (!name || name === "." || name === ".." || name.includes("..")) return null;
    // Only CMS uploads use hero-<timestamp> / hands-on-<timestamp> names.
    if (!/^(hero|hands-on)-\d+\.[a-z0-9]+$/i.test(name)) return null;
    return path.join(MEDIA_DIR, name);
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

  await mkdir(MEDIA_DIR, { recursive: true });

  const stamp = Date.now();
  const safeSlot = opts.slot === "hero" ? "hero" : "hands-on";
  const diskName = `${safeSlot}-${stamp}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(path.join(MEDIA_DIR, diskName), bytes);

  // Remove the previous local upload (if any) after the new file is written.
  if (opts.previousUrl) {
    await deleteHomeMediaFromPublic(opts.previousUrl);
  }

  // Public URL served from /public
  return `/media/home/${diskName}`;
}
/** Seed local CMS from defaults if missing (so admin always has a row). */
export async function ensureLocalHomeCms(): Promise<LocalHomeCmsRecord> {
  const existing = await readLocalHomeCms();
  if (existing) return existing;
  return writeLocalHomeCms({
    title: "Home Page",
    metaTitle: "",
    metaDescription: "",
    pageData: defaultHomeContent,
  });
}

