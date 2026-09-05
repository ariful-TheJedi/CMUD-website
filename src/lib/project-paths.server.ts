/**
 * Resolve project root and the permanent assets directory.
 *
 * Uploads / static media must NOT live under wipeable `.output/public`.
 * Prefer an external folder (e.g. sibling `cmud-assets`) via ASSETS_ROOT so
 * `npm run build` never requires re-uploading media.
 *
 * Server-only — do not import from client components.
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKER_PKG = "package.json";

function isInsideOutputDir(dir: string): boolean {
  const normalized = path.resolve(dir).replace(/\\/g, "/");
  return /(^|\/)\.output(\/|$)/.test(normalized);
}

function looksLikeProjectRoot(dir: string): boolean {
  if (!existsSync(path.join(dir, MARKER_PKG))) return false;
  if (isInsideOutputDir(dir)) return false;
  return true;
}

function walkUpForProjectRoot(start: string): string | null {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (looksLikeProjectRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function projectRootFromEnv(): string | null {
  const raw = process.env.PROJECT_ROOT?.trim() || "";
  if (!raw) return null;
  const resolved = path.resolve(raw);
  if (!existsSync(resolved)) return null;
  return resolved;
}

function rootFromImportMeta(): string | null {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    return walkUpForProjectRoot(here);
  } catch {
    return null;
  }
}

let cachedProjectRoot: string | null = null;
let cachedAssetsRoot: string | null = null;

/**
 * Absolute path to the app project root (folder with `package.json` — never `.output`).
 */
export function getProjectRoot(): string {
  if (cachedProjectRoot) return cachedProjectRoot;

  const fromEnv = projectRootFromEnv();
  if (fromEnv) {
    cachedProjectRoot = fromEnv;
    return cachedProjectRoot;
  }

  const fromMeta = rootFromImportMeta();
  if (fromMeta) {
    cachedProjectRoot = fromMeta;
    return cachedProjectRoot;
  }

  const fromCwd = walkUpForProjectRoot(process.cwd());
  if (fromCwd) {
    cachedProjectRoot = fromCwd;
    return cachedProjectRoot;
  }

  const cwd = path.resolve(process.cwd());
  const outputIdx = cwd.replace(/\\/g, "/").lastIndexOf("/.output");
  if (outputIdx >= 0) {
    cachedProjectRoot = cwd.slice(0, outputIdx) || path.dirname(cwd);
    return cachedProjectRoot;
  }

  cachedProjectRoot = cwd;
  return cachedProjectRoot;
}

/**
 * Absolute filesystem root for media / attachments (the real "public" content).
 *
 * Resolution order:
 * 1. `ASSETS_ROOT` or `PUBLIC_ASSETS_DIR` (external folder, e.g. `/www/wwwroot/cmud-assets`)
 * 2. `UPLOAD_PUBLIC_ROOT` if it points at a `public` dir or assets dir
 * 3. Fallback: `[project-root]/public`
 */
export function getAssetsRoot(): string {
  if (cachedAssetsRoot) return cachedAssetsRoot;

  const fromEnv =
    process.env.ASSETS_ROOT?.trim() ||
    process.env.PUBLIC_ASSETS_DIR?.trim() ||
    process.env.UPLOAD_PUBLIC_ROOT?.trim() ||
    "";

  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    mkdirSync(resolved, { recursive: true });
    // Both CMS image and notice attachment trees live under the same external root.
    mkdirSync(path.join(resolved, "media"), { recursive: true });
    mkdirSync(path.join(resolved, "attachment"), { recursive: true });
    cachedAssetsRoot = resolved;
    return cachedAssetsRoot;
  }

  const fallback = path.join(getProjectRoot(), "public");
  mkdirSync(fallback, { recursive: true });
  mkdirSync(path.join(fallback, "media"), { recursive: true });
  mkdirSync(path.join(fallback, "attachment"), { recursive: true });
  cachedAssetsRoot = fallback;
  return cachedAssetsRoot;
}

/** @deprecated Prefer getAssetsRoot() — kept for older call sites. */
export function getPublicDir(): string {
  return getAssetsRoot();
}

/** `[assets-root]/media` or a subfolder. Ensures the directory exists. */
export function getMediaDir(folder?: string): string {
  const dir = folder
    ? path.join(getAssetsRoot(), "media", folder)
    : path.join(getAssetsRoot(), "media");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** `[assets-root]/attachment` or a subfolder. Ensures the directory exists. */
export function getAttachmentDir(folder?: string): string {
  const dir = folder
    ? path.join(getAssetsRoot(), "attachment", folder)
    : path.join(getAssetsRoot(), "attachment");
  mkdirSync(dir, { recursive: true });
  return dir;
}
