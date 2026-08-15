/**
 * Serve newly written uploads under public/media and public/attachment.
 *
 * Vite keeps a `publicFiles` allowlist and only adds new files after chokidar
 * fires — on Windows that delay often makes admin previews 404 until reload.
 * This post-middleware reads those paths from disk so uploads work immediately.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

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

function isUploadPath(pathname: string): boolean {
  return pathname.startsWith("/media/") || pathname.startsWith("/attachment/");
}

export function serveFreshUploadsPlugin(): Plugin {
  return {
    name: "serve-fresh-uploads",
    configureServer(server) {
      const publicDir = path.resolve(server.config.root, "public");

      return () => {
        server.middlewares.use((req, res, next) => {
          try {
            const rawUrl = req.url ?? "";
            const pathname = decodeURIComponent(rawUrl.split("?")[0] || "");
            if (!isUploadPath(pathname)) {
              next();
              return;
            }

            const rel = pathname.replace(/^\/+/, "");
            if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
              next();
              return;
            }

            const filePath = path.resolve(publicDir, rel);
            if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
              next();
              return;
            }

            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
              next();
              return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const type = MIME[ext] || "application/octet-stream";
            res.statusCode = 200;
            res.setHeader("Content-Type", type);
            res.setHeader("Cache-Control", "no-cache");
            fs.createReadStream(filePath).pipe(res);
          } catch {
            next();
          }
        });
      };
    },
  };
}
