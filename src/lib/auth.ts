import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { pool } from "@/lib/db";
import { getAppEnv } from "@/lib/env";

/**
 * Better Auth server (self-hosted).
 * Tables: npm run auth:migrate
 *
 * Required env:
 *   BETTER_AUTH_SECRET, BETTER_AUTH_URL (exact browser origin, no trailing slash)
 * Optional:
 *   BETTER_AUTH_TRUSTED_ORIGINS — comma-separated extra origins (LAN IPs, etc.)
 */
const { betterAuthSecret, betterAuthUrl, trustedOrigins } = getAppEnv();

export const auth = betterAuth({
  database: pool,
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    // Keep admin session intact when creating users via API; clients still sign in explicitly.
    autoSignIn: false,
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
