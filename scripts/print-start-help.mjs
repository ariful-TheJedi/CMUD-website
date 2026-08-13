/**
 * Printed after `npm run build` so VM operators know how to start the server.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const entry = path.resolve(process.cwd(), ".output/server/index.mjs");
const ok = existsSync(entry);

console.log("");
console.log("────────────────────────────────────────────");
console.log(ok ? "✓ Build ready for self-hosted Node" : "✗ Build output missing");
console.log(`  Server file: ${entry}`);
console.log("");
console.log("  Start production:");
console.log("    npm start");
console.log("  Or:");
console.log("    node ./scripts/start-prod.mjs");
console.log("  Or PM2:");
console.log("    pm2 start ecosystem.config.cjs");
console.log("");
console.log("  Required .env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL");
console.log("  Default bind:  HOST=0.0.0.0 PORT=3000");
console.log("────────────────────────────────────────────");
console.log("");
