/**
 * Server auth middleware for createServerFn handlers.
 * Validates Better Auth session; exposes userId + role.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export type AuthRole = "administrator" | "staff" | "web_manager" | "viewer" | string;

const STAFF_ROLES = new Set(["administrator", "staff", "web_manager", "viewer"]);

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  if (!request?.headers) {
    throw new Error("Unauthorized: No request headers available");
  }

  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = ((session.user as { role?: string | null }).role ?? "").trim();
  if (!role || !STAFF_ROLES.has(role)) {
    throw new Error("Forbidden: staff role required");
  }

  // Soft status gate (admin/users can set inactive/suspended on Better Auth user rows).
  try {
    const { pool } = await import("@/lib/db");
    await pool.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
    );
    const { rows } = await pool.query<{ status: string | null }>(
      `SELECT status FROM "user" WHERE id = $1`,
      [session.user.id],
    );
    const status = (rows[0]?.status ?? "active").trim();
    if (status !== "active") {
      throw new Error(
        status === "suspended"
          ? "This account was deleted"
          : "Account is not active",
      );
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "Account is not active" || err.message === "This account was deleted")
    ) {
      throw err;
    }
    // Column missing / transient DB issues should not lock out login mid-migrate.
  }

  return next({
    context: {
      userId: session.user.id,
      role,
      session,
      claims: { sub: session.user.id, email: session.user.email },
    },
  });
});
