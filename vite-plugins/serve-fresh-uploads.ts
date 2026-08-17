/**
 * Serve uploads from ASSETS_ROOT (or project/public) for Vite dev.
 * Supports optional VITE_ASSETS_PREFIX (e.g. /cmud-assets/media/...).
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

function normalizePrefix(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value || /^https?:\/\//i.test(value)) return "";
  return value.replace(/\/+$/, "");
}

function stripPrefix(pathname: string, prefix: string): string {
  if (!prefix) return pathname;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || "/";
  return pathname;
}

function isUploadPath(pathname: string): boolean {
  return pathname.startsWith("/media/") || pathname.startsWith("/attachment/");
}

function resolveAssetsRoot(projectRoot: string): string {
  const fromEnv =
    process.env.ASSETS_ROOT?.trim() ||
    process.env.PUBLIC_ASSETS_DIR?.trim() ||
    process.env.UPLOAD_PUBLIC_ROOT?.trim() ||
    "";
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(projectRoot, "public");
}

export function serveFreshUploadsPlugin(): Plugin {
  return {
    name: "serve-fresh-uploads",
    configureServer(server) {
      const assetsRoot = resolveAssetsRoot(server.config.root);
      const prefix = normalizePrefix(
        process.env.VITE_ASSETS_PREFIX || process.env.ASSETS_PREFIX,
      );

      return () => {
        server.middlewares.use((req, res, next) => {
          try {
            const rawUrl = req.url ?? "";
            const rawPathname = decodeURIComponent(rawUrl.split("?")[0] || "");
            const pathname = stripPrefix(rawPathname, prefix);
            if (!isUploadPath(pathname)) {
              next();
              return;
            }

            const rel = pathname.replace(/^\/+/, "");
            if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
              next();
              return;
            }

            const filePath = path.resolve(assetsRoot, rel);
            if (!filePath.startsWith(assetsRoot + path.sep) && filePath !== assetsRoot) {
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
            res.setHeader("Cache-Control", "no-store");
            fs.createReadStream(filePath).pipe(res);
          } catch {
            next();
          }
        });
      };
    },
  };
}
