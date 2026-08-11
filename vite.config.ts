// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Force self-hosted Node for CLI / CI even if a cloud preset env leaks in.
process.env.NITRO_PRESET = "node-server";

export default defineConfig({
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
