import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { pool } from "@/lib/db";
import { buildTrustedOrigins, getAppEnv, normalizeOrigin } from "@/lib/env";

/**
 * Better Auth server (self-hosted).
 * Tables: npm run auth:migrate
 *
 * Required env:
 *   BETTER_AUTH_SECRET
 *   BETTER_AUTH_URL — exact browser origin (e.g. http://192.168.0.113:3000), no trailing slash
 * Optional:
 *   BETTER_AUTH_TRUSTED_ORIGINS — comma-separated extras, or "*" to trust the request Origin
 */
const { betterAuthSecret, betterAuthUrl } = getAppEnv();

const staticTrustedOrigins = buildTrustedOrigins(betterAuthUrl);

console.info(`[auth] baseURL=${betterAuthUrl}`);
console.info(`[auth] trustedOrigins(static)=${staticTrustedOrigins.join(", ")}`);

export const auth = betterAuth({
  database: pool,
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  /**
   * Always allow configured origins + the browser Origin/Referer of the current request.
   * Prevents "Invalid origin" when accessing the VPS by LAN IP while .env still has localhost.
   */
  trustedOrigins: async (request) => {
    const origins = new Set(staticTrustedOrigins);
    const extras = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").trim();
    if (extras === "*") {
      // Explicit opt-in: trust whatever Origin the browser sends (self-hosted LAN/VPS).
      const wild = request?.headers?.get("origin") || request?.headers?.get("referer");
      if (wild) {
        try {
          origins.add(new URL(wild).origin);
        } catch {
          /* ignore */
        }
      }
    }
    const header = request?.headers?.get("origin") || request?.headers?.get("referer");
    if (header) {
      try {
        origins.add(normalizeOrigin(new URL(header).origin));
      } catch {
        /* ignore */
      }
    }
    return [...origins];
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "staff",
        input: false,
        returned: true,
      },
    },
  },
  plugins: [tanstackStartCookies()],
});

export type Session = typeof auth.$Infer.Session;

/** @deprecated Prefer importing pool from `@/lib/db`. */
export { pool };
