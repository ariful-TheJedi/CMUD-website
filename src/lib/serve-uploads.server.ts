/**
 * Serve permanent upload files from ASSETS_ROOT (`media/`, `attachment/`).
 * Production Node entry — files live outside wipeable `.output/public`.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getAssetsPrefix, stripAssetsPrefix } from "@/lib/assets";
import { getAssetsRoot } from "@/lib/project-paths.server";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
};

function isUploadRelPath(pathname: string): boolean {
  return pathname.startsWith("/media/") || pathname.startsWith("/attachment/");
}

export function isUploadRequestPath(pathname: string): boolean {
  if (isUploadRelPath(pathname)) return true;
  const stripped = stripAssetsPrefix(pathname);
  return stripped !== pathname && isUploadRelPath(stripped);
}

export async function tryServePermanentUpload(request: Request): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const { pathname: rawPathname } = new URL(request.url);
  if (!isUploadRequestPath(rawPathname)) return null;

  const pathname = stripAssetsPrefix(decodeURIComponent(rawPathname));
  if (!isUploadRelPath(pathname)) return null;

  const rel = pathname.replace(/^\/+/, "");
  if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
    return new Response("Not found", { status: 404 });
  }

  const assetsRoot = getAssetsRoot();
  const filePath = path.resolve(assetsRoot, rel);
  if (!filePath.startsWith(assetsRoot + path.sep) && filePath !== assetsRoot) {
    return new Response("Not found", { status: 404 });
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
  return new Response(webStream, { status: 200, headers });
}

/** Log once at boot so operators can confirm assets wiring. */
export function logAssetsConfig(): void {
  const prefix = getAssetsPrefix() || "(none — serve at /media and /attachment)";
  console.log(`[assets] root=${getAssetsRoot()} prefix=${prefix}`);
}
