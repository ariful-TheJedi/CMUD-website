// Shared server-side authorization helpers (Better Auth + per-user content access).

import {
  type ContentAccess,
  type ContentSection,
  type PermissionsMap,
  canUpdateAccess,
  canViewAccess,
  emptyPermissions,
  ensureContentPermissionsSchema,
  isStaffRole,
  loadUserPermissions,
  normalizeAppRole,
} from "@/lib/content-access";

export type StaffContext = {
  userId: string;
  role?: string;
};

export type StaffInfo = {
  isAdministrator: boolean;
  /** @deprecated Prefer section permissions; true when role is staff (or legacy manager). */
  isWebManager: boolean;
  /** @deprecated Prefer section permissions. */
  isViewer: boolean;
  isStaff: boolean;
  role: string;
  permissions: PermissionsMap;
};

function roleFromContext(ctx: StaffContext): string {
  const role = (ctx.role ?? "").trim();
  if (!role) throw new Error("Forbidden");
  return role;
}

export async function loadActiveStaff(ctx: StaffContext): Promise<StaffInfo> {
  if (!ctx.userId) throw new Error("Unauthorized");

  const role = roleFromContext(ctx);
  if (!isStaffRole(role)) throw new Error("Forbidden");

  await ensureContentPermissionsSchema();

  const isAdministrator = role === "administrator";
  const normalized = normalizeAppRole(role) ?? "staff";
  const permissions = isAdministrator
    ? (Object.fromEntries(
        Object.keys(emptyPermissions()).map((k) => [k, "update" as ContentAccess]),
      ) as PermissionsMap)
    : await loadUserPermissions(ctx.userId);

  // Legacy compatibility flags for older UI checks during transition.
  const hasAnyUpdate = Object.values(permissions).some((a) => a === "update");
  const hasAnyView = Object.values(permissions).some((a) => a === "view" || a === "update");

  return {
    isAdministrator,
    isStaff: normalized === "staff" || isAdministrator,
    isWebManager: isAdministrator || (normalized === "staff" && hasAnyUpdate),
    isViewer: !isAdministrator && hasAnyView && !hasAnyUpdate,
    role,
    permissions,
  };
}

export async function assertStaffRead(ctx: StaffContext): Promise<StaffInfo> {
  return loadActiveStaff(ctx);
}

/** Staff with update on at least one section, or administrator. Prefer assertSectionUpdate. */
export async function assertActiveStaff(ctx: StaffContext): Promise<StaffInfo> {
  const info = await loadActiveStaff(ctx);
  if (info.isAdministrator) return info;
  const canWrite = Object.values(info.permissions).some((a) => canUpdateAccess(a));
  if (!canWrite) throw new Error("Forbidden: read-only access");
  return info;
}

export async function assertActiveAdministrator(ctx: StaffContext): Promise<StaffInfo> {
  const info = await loadActiveStaff(ctx);
  if (!info.isAdministrator) {
    throw new Error("Forbidden: administrator role required");
  }
  return info;
}

export async function assertSectionView(
  ctx: StaffContext,
  section: ContentSection,
): Promise<StaffInfo> {
  const info = await loadActiveStaff(ctx);
  if (info.isAdministrator) return info;
  if (!canViewAccess(info.permissions[section] ?? "none")) {
    throw new Error(`Forbidden: no view access to ${section}`);
  }
  return info;
}

export async function assertSectionUpdate(
  ctx: StaffContext,
  section: ContentSection,
): Promise<StaffInfo> {
  const info = await loadActiveStaff(ctx);
  if (info.isAdministrator) return info;
  if (!canUpdateAccess(info.permissions[section] ?? "none")) {
    throw new Error(`Forbidden: no update access to ${section}`);
  }
  return info;
}

export function sectionAccess(info: StaffInfo, section: ContentSection): ContentAccess {
  if (info.isAdministrator) return "update";
  return info.permissions[section] ?? "none";
}

export const assertCanCreateContent = assertActiveStaff;
export const assertCanEditContent = assertActiveStaff;
export const assertCanPublishContent = assertActiveAdministrator;
export const assertCanDeleteContent = assertActiveAdministrator;
