import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import {
  type AppRole,
  type ContentAccess,
  type PermissionsMap,
  canUpdateSection,
  canViewSection,
  emptyPermissions,
  isStaffRole,
  normalizeAppRole,
  sectionAccessOf,
} from "@/lib/content-access.shared";

export type { AppRole, ContentAccess, PermissionsMap };
export type { ContentSection } from "@/lib/content-access.shared";
export { canUpdateSection, canViewSection, sectionAccessOf };

export type CurrentUserInfo = {
  userId: string;
  email: string | null;
  fullName: string | null;
  status: "active" | "inactive" | "suspended";
  roles: AppRole[];
  role: AppRole | null;
  roleLabel: string;
  isAdministrator: boolean;
  /** True when staff has update on any section (legacy compatibility). */
  isWebManager: boolean;
  /** True when staff is view-only across granted sections (legacy compatibility). */
  isViewer: boolean;
  isStaff: boolean;
  hasAdminAccess: boolean;
  permissions: PermissionsMap;
};

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<CurrentUserInfo> => {
    const { userId, role, session } = context as {
      userId: string;
      role: string;
      session: { user: { email?: string | null; name?: string | null } };
    };

    const { ensureContentPermissionsSchema, loadUserPermissions } = await import(
      "@/lib/content-access"
    );
    const { pool } = await import("@/lib/db");

    await ensureContentPermissionsSchema();
    await pool.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role_label TEXT NOT NULL DEFAULT ''`,
    );

    const normalized = (role ?? "").trim();
    const appRole = normalizeAppRole(normalized);
    const isAdministrator = normalized === "administrator";
    const isStaff = appRole === "staff" || isAdministrator;

    const { rows: labelRows } = await pool.query<{ role_label: string | null }>(
      `SELECT role_label FROM "user" WHERE id = $1`,
      [userId],
    );
    const rawLabel = (labelRows[0]?.role_label ?? "").trim();
    const roleLabel = isAdministrator ? "Administrator" : rawLabel || "Staff";

    const permissions = isAdministrator
      ? (Object.fromEntries(
          Object.keys(emptyPermissions()).map((k) => [k, "update" as ContentAccess]),
        ) as PermissionsMap)
      : await loadUserPermissions(userId);

    const hasAnyUpdate = Object.values(permissions).some((a) => a === "update");
    const hasAnyView = Object.values(permissions).some((a) => a === "view" || a === "update");

    return {
      userId,
      email: session?.user?.email ?? null,
      fullName: session?.user?.name ?? null,
      status: "active",
      roles: appRole ? [appRole] : [],
      role: appRole,
      roleLabel,
      isAdministrator,
      isStaff,
      isWebManager: isAdministrator || (isStaff && hasAnyUpdate),
      isViewer: !isAdministrator && hasAnyView && !hasAnyUpdate,
      hasAdminAccess: isStaffRole(normalized),
      permissions,
    };
  });
