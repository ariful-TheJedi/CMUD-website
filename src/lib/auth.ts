import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { pool } from "@/lib/db";

/**
 * Better Auth server (Phase 2/3).
 * Tables: npm run auth:migrate
 * Dev origin: BETTER_AUTH_URL or http://localhost:8080
 */
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:8080";

export const auth = betterAuth({
  database: pool,
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    baseURL,
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
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
