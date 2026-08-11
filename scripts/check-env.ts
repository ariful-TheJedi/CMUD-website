/**
 * Preflight: verify required env for self-hosted deploy.
 * Usage: npm run check:env
 */
import { getAppEnv, loadEnvFileIfPresent } from "../src/lib/env";

loadEnvFileIfPresent();

try {
  const env = getAppEnv();
  console.log("[check:env] OK");
  console.log(`  DATABASE_URL     = ${env.databaseUrl.replace(/:[^:@/]+@/, ":***@")}`);
  console.log(`  BETTER_AUTH_URL  = ${env.betterAuthUrl}`);
  console.log(`  HOST/PORT        = ${env.host}:${env.port}`);
  console.log(`  trustedOrigins   = ${env.trustedOrigins.length} entries`);
  process.exit(0);
} catch (err) {
  console.error("[check:env] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
}
