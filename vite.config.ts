// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { serveFreshUploadsPlugin } from "./vite-plugins/serve-fresh-uploads";

// Force self-hosted Node for CLI / CI even if a cloud preset env leaks in.
process.env.NITRO_PRESET = "node-server";

/** Ensure .env is loaded before Vite bakes VITE_* into the client bundle. */
function loadEnvFile(filePath = path.resolve(process.cwd(), ".env")) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile();

const assetsPrefix = (process.env.VITE_ASSETS_PREFIX || process.env.ASSETS_PREFIX || "").trim();
if (assetsPrefix && !process.env.VITE_ASSETS_PREFIX) {
  process.env.VITE_ASSETS_PREFIX = assetsPrefix;
}

export default defineConfig({
  plugins: [serveFreshUploadsPlugin()],
  // Bake prefix into the client so img src becomes /cmud-assets/media/... after build.
  envPrefix: ["VITE_"],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  // Standalone Linux / Windows Node server — NOT Cloudflare Workers / Wrangler.
  // Output: .output/server/index.mjs — start with `npm start` or PM2 (ecosystem.config.cjs).
  nitro: {
    preset: "node-server",
  },
});
