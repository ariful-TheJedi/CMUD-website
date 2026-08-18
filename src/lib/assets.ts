/**
 * Browser URL helper for media / attachments under the external assets root.
 *
 * Prefix resolution (first non-empty wins):
 * 1. `window.__CMUD_ASSETS_PREFIX__` (injected each SSR from server .env)
 * 2. `import.meta.env.VITE_ASSETS_PREFIX` (baked at build)
 * 3. `process.env.VITE_ASSETS_PREFIX` / `ASSETS_PREFIX` (Node / PM2)
 *
 * CMS/DB keeps unprefixed paths (`/media/...`). Prefix is applied for the browser.
 * Site icons (`/favicon.png`) are never prefixed.
 */

declare global {
  interface Window {
    __CMUD_ASSETS_PREFIX__?: string;
  }
}

function normalizePrefix(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function readPrefixFromEnv(): string {
  // Prefer Vite-baked value (works in admin CSR routes with ssr:false).
  const vite =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_ASSETS_PREFIX as string | undefined)
      : undefined;
  if (normalizePrefix(vite)) return normalizePrefix(vite);

  if (typeof window !== "undefined") {
    const fromWindow = normalizePrefix(window.__CMUD_ASSETS_PREFIX__);
    if (fromWindow) return fromWindow;
  }

  if (typeof process !== "undefined") {
    return normalizePrefix(process.env.ASSETS_PREFIX || process.env.VITE_ASSETS_PREFIX);
  }
  return "";
}

/** URL prefix with no trailing slash (empty when unset). Re-read each call so SSR picks up .env. */
export function getAssetsPrefix(): string {
  return readPrefixFromEnv();
}

export function isSiteIconPath(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return (
    p === "/favicon.png" ||
    p === "/favicon.ico" ||
    p === "/apple-touch-icon.png" ||
    /^\/favicon(-\d+)?\.png$/i.test(p) ||
    /^\/icon-\d+\.png$/i.test(p)
  );
}

function isAssetRelativePath(pathname: string): boolean {
  return pathname.startsWith("/media/") || pathname.startsWith("/attachment/");
}

/** Turn absolute site URLs back into a pathname for prefixing. */
function toPathname(raw: string): string | null {
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      return u.pathname || "/";
    } catch {
      return null;
    }
  }

  return raw.startsWith("/") ? raw : `/${raw}`;
}

/**
 * Build the public URL for a stored asset path.
 * Accepts `/media/...`, `/attachment/...`, or absolute `https://host/media/...`.
 */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  const raw = path.trim();
  if (!raw) return "";

  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  const pathname = toPathname(raw);
  if (!pathname) return raw;

  if (isSiteIconPath(pathname)) return pathname;

  const prefix = getAssetsPrefix();
  if (!prefix) return isAssetRelativePath(pathname) ? pathname : pathname;

  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return pathname;

  if (!isAssetRelativePath(pathname)) return pathname;

  if (/^https?:\/\//i.test(prefix)) {
    return `${prefix}${pathname}`;
  }
  return `${prefix}${pathname}`;
}

/** Strip URL prefix so disk lookup can use paths relative to ASSETS_ROOT. */
export function stripAssetsPrefix(pathname: string): string {
  const prefix = getAssetsPrefix();
  if (!prefix || /^https?:\/\//i.test(prefix)) return pathname;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length) || "/";
  }
  return pathname;
}

/**
 * Normalize any browser/CMS URL to the path stored in the database.
 * Always returns unprefixed `/media/...` or `/attachment/...` when applicable.
 * External https URLs (not our media store) are kept as-is.
 * Never store prefixed paths like `/cmud-assets/media/...` in Postgres.
 */
export function toStoragePath(input: string | null | undefined): string {
  if (!input) return "";
  const raw = input.trim();
  if (!raw || raw.startsWith("blob:") || raw.startsWith("data:")) return "";

  let pathname = raw;
  let isAbsolute = false;
  if (/^https?:\/\//i.test(raw)) {
    isAbsolute = true;
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return raw;
    }
  }

  pathname = (pathname.split("?")[0] || "").trim();
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  pathname = stripAssetsPrefix(pathname);

  const mediaIdx = pathname.indexOf("/media/");
  if (mediaIdx >= 0) return pathname.slice(mediaIdx);

  const attIdx = pathname.indexOf("/attachment/");
  if (attIdx >= 0) return pathname.slice(attIdx);

  if (isAbsolute) return raw;
  return pathname;
}

/** True when the value points at a local `/media/<folder>/...` upload (after normalize). */
export function isLocalMediaUrl(url: string | null | undefined, folder?: string): boolean {
  const path = toStoragePath(url);
  if (!path.startsWith("/media/")) return false;
  if (!folder) return true;
  return path.startsWith(`/media/${folder}/`);
}

/** True when the value points at a local `/attachment/<folder>/...` upload. */
export function isLocalAttachmentUrl(url: string | null | undefined, folder?: string): boolean {
  const path = toStoragePath(url);
  if (!path.startsWith("/attachment/")) return false;
  if (!folder) return true;
  return path.startsWith(`/attachment/${folder}/`);
}

/** Inline script + value for SSR so the client uses the same prefix without a rebuild. */
export function getAssetsPrefixBootstrap(): { prefix: string; script: string } {
  const prefix = getAssetsPrefix();
  return {
    prefix,
    script: `window.__CMUD_ASSETS_PREFIX__=${JSON.stringify(prefix)};`,
  };
}
