/**
 * Serve permanent upload files from `[project-root]/public/{media,attachment}/`.
 * Used by the production Node entry so new uploads work without copying into `.output/public`.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getPublicDir } from "@/lib/project-paths.server";

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

export function isUploadRequestPath(pathname: string): boolean {
  return pathname.startsWith("/media/") || pathname.startsWith("/attachment/");
}

export async function tryServePermanentUpload(request: Request): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const { pathname } = new URL(request.url);
  if (!isUploadRequestPath(pathname)) return null;

  const rel = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
    return new Response("Not found", { status: 404 });
  }

  const publicDir = getPublicDir();
  const filePath = path.resolve(publicDir, rel);
  if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
    return new Response("Not found", { status: 404 });
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return null;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "public, max-age=3600",
  });

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
  return new Response(webStream, { status: 200, headers });
}
