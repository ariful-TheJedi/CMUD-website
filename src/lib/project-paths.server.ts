/**
 * Resolve the permanent project root / public upload dirs.
 *
 * Nitro production runs from `.output/server/`. If cwd is `.output` (or under it),
 * `process.cwd()/public` points at the wipeable build tree. Uploads must always
 * land in `[project-root]/public/{media,attachment}/`, which Nginx serves and
 * which survives `npm run build`.
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
  // Prefer roots that are not inside the Nitro build output.
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

function rootFromEnv(): string | null {
  const raw =
    process.env.PROJECT_ROOT?.trim() ||
    process.env.UPLOAD_PUBLIC_ROOT?.trim() ||
    "";
  if (!raw) return null;
  const resolved = path.resolve(raw);
  if (!existsSync(resolved)) return null;
  // If env points at public/, use its parent as project root.
  if (path.basename(resolved) === "public" && existsSync(path.join(path.dirname(resolved), MARKER_PKG))) {
    return path.dirname(resolved);
  }
  return resolved;
}

function rootFromImportMeta(): string | null {
  try {
    // Bundled Nitro chunks live under `.output/server/...` — walk up past `.output`.
    const here = path.dirname(fileURLToPath(import.meta.url));
    return walkUpForProjectRoot(here);
  } catch {
    return null;
  }
}

let cachedRoot: string | null = null;

/**
 * Absolute path to the app project root (the folder that contains `package.json`
 * and the permanent `public/` directory — never `.output`).
 */
export function getProjectRoot(): string {
  if (cachedRoot) return cachedRoot;

  const fromEnv = rootFromEnv();
  if (fromEnv) {
    cachedRoot = fromEnv;
    return cachedRoot;
  }

  const fromMeta = rootFromImportMeta();
  if (fromMeta) {
    cachedRoot = fromMeta;
    return cachedRoot;
  }

  const fromCwd = walkUpForProjectRoot(process.cwd());
  if (fromCwd) {
    cachedRoot = fromCwd;
    return cachedRoot;
  }

  // Last resort: if cwd is inside `.output`, use the parent of `.output`.
  const cwd = path.resolve(process.cwd());
  const outputIdx = cwd.replace(/\\/g, "/").lastIndexOf("/.output");
  if (outputIdx >= 0) {
    cachedRoot = cwd.slice(0, outputIdx) || path.dirname(cwd);
    return cachedRoot;
  }

  cachedRoot = cwd;
  return cachedRoot;
}

/** Permanent `[project-root]/public` (survives Nitro rebuilds). */
export function getPublicDir(): string {
  return path.join(getProjectRoot(), "public");
}

/** `[project-root]/public/media` or a subfolder. Ensures the directory exists. */
export function getMediaDir(folder?: string): string {
  const dir = folder
    ? path.join(getPublicDir(), "media", folder)
    : path.join(getPublicDir(), "media");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** `[project-root]/public/attachment` or a subfolder. Ensures the directory exists. */
export function getAttachmentDir(folder?: string): string {
  const dir = folder
    ? path.join(getPublicDir(), "attachment", folder)
    : path.join(getPublicDir(), "attachment");
  mkdirSync(dir, { recursive: true });
  return dir;
}
