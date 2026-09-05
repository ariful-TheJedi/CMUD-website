import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { requireAuth } from "@/lib/require-auth";
import { assertActiveAdministrator, type StaffContext } from "@/lib/admin-guards";
import { asIso, dbQuery } from "@/lib/db-helpers";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  type AppRole,
  type ContentAccess,
  type ContentSection,
  type PermissionsMap,
  ASSIGNABLE_SECTIONS,
  emptyPermissions,
  isStaffRole,
  normalizeAccess,
  normalizeAppRole,
  summarizePermissions,
} from "@/lib/content-access.shared";
import {
  ensureContentPermissionsSchema,
  loadUserPermissions,
  replaceUserPermissions,
} from "@/lib/content-access";

export type { AppRole, PermissionsMap, ContentAccess, ContentSection };

export type UserStatus = "active" | "inactive" | "suspended";

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  status: UserStatus;
  role: AppRole | null;
  /** Custom display name for staff (e.g. "Gallery Editor"). Admins use "Administrator". */
  roleLabel: string;
  permissions: PermissionsMap;
  permissionsSummary: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function ensureUserStatusColumn() {
  await pool.query(
    `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
  );
}

async function ensureRoleLabelColumn() {
  await pool.query(
    `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role_label TEXT NOT NULL DEFAULT ''`,
  );
}

function normalizeRoleLabel(role: AppRole | null, label: unknown): string {
  if (role === "administrator") return "Administrator";
  const trimmed = typeof label === "string" ? label.trim() : "";
  return trimmed || "Staff";
}

function sanitizeRoleLabelInput(role: AppRole, label: string | undefined): string {
  if (role === "administrator") return "Administrator";
  const trimmed = (label ?? "").trim();
  if (!trimmed) throw new Error("Role name is required for staff users");
  if (trimmed.length > 80) throw new Error("Role name must be 80 characters or less");
  if (/^administrator$/i.test(trimmed)) {
    throw new Error('Use the Administrator access type instead of naming a role "Administrator"');
  }
  return trimmed;
}

function normalizeStatus(v: unknown): UserStatus {
  if (v === "inactive" || v === "suspended" || v === "active") return v;
  return "active";
}

/** Local admin-set passwords (email recovery comes later). */
function assertValidAdminPassword(password: string): string {
  const pw = password.trim();
  if (pw.length < 8) throw new Error("Password must be at least 8 characters");
  if (pw.length > 128) throw new Error("Password must be 128 characters or less");
  return pw;
}

function sanitizePermissionsInput(
  input: Partial<Record<ContentSection, ContentAccess>> | PermissionsMap | undefined,
  role: AppRole,
): PermissionsMap {
  if (role === "administrator") return emptyPermissions();
  const base = emptyPermissions();
  if (!input) return base;
  for (const section of ASSIGNABLE_SECTIONS) {
    base[section] = normalizeAccess(input[section]);
  }
  return base;
}

async function setAccountPassword(userId: string, password: string) {
  const hashed = await hashPassword(password);
  const { rowCount } = await pool.query(
    `UPDATE account SET password = $1, "updatedAt" = now()
     WHERE "userId" = $2 AND "providerId" = 'credential'`,
    [hashed, userId],
  );
  if (!rowCount) {
    const id = randomBytes(16).toString("hex");
    await pool.query(
      `INSERT INTO account (
         id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
       ) VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
      [id, userId, hashed],
    );
  }
}

/**
 * Create a Better Auth user + credential account without signing them in.
 * (signUpEmail would set a session cookie and replace the admin's login.)
 */
async function createAuthUserWithoutSession(input: {
  email: string;
  name: string;
  password: string;
  role: AppRole;
  roleLabel: string;
  status: UserStatus;
}): Promise<string> {
  const userId = randomBytes(16).toString("hex");
  const hashed = await hashPassword(input.password);
  const accountId = randomBytes(16).toString("hex");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO "user" (
         id, name, email, "emailVerified", image, "createdAt", "updatedAt",
         role, status, role_label
       ) VALUES (
         $1, $2, $3, false, null, now(), now(),
         $4, $5, $6
       )`,
      [userId, input.name, input.email, input.role, input.status, input.roleLabel],
    );
    await client.query(
      `INSERT INTO account (
         id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
       ) VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
      [accountId, userId, hashed],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return userId;
}

async function countActiveAdministrators(excludeId?: string): Promise<number> {
  const { rows } = await dbQuery<{ count: string }>(
    "countActiveAdministrators",
    excludeId
      ? `SELECT COUNT(*)::text AS count FROM "user"
         WHERE role = 'administrator' AND COALESCE(status, 'active') = 'active' AND id <> $1`
      : `SELECT COUNT(*)::text AS count FROM "user"
         WHERE role = 'administrator' AND COALESCE(status, 'active') = 'active'`,
    excludeId ? [excludeId] : [],
  );
  return Number(rows[0]?.count ?? 0);
}

async function writeUserAudit(
  ctx: StaffContext,
  input: {
    action: string;
    targetUserId: string | null;
    summary: string;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
  },
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, content_type, content_id, summary, previous_value, new_value)
       VALUES ($1, $2, 'user', $3, $4, $5::jsonb, $6::jsonb)`,
      [
        ctx.userId,
        input.action,
        input.targetUserId,
        input.summary.slice(0, 240),
        JSON.stringify(input.previousValue ?? null),
        JSON.stringify(input.newValue ?? null),
      ],
    );
  } catch (err) {
    console.error("DB Error in writeUserAudit:", err);
  }
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertActiveAdministrator(context);
    await ensureUserStatusColumn();
    await ensureRoleLabelColumn();
    await ensureContentPermissionsSchema();

    const { rows } = await dbQuery<{
      id: string;
      email: string | null;
      name: string | null;
      role: string | null;
      roleLabel: string | null;
      status: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
      lastLoginAt: string | Date | null;
    }>(
      "listAdminUsers",
      `SELECT u.id, u.email, u.name, u.role, u.role_label AS "roleLabel", u.status,
              u."createdAt" AS "createdAt", u."updatedAt" AS "updatedAt",
              (
                SELECT MAX(s."updatedAt") FROM session s WHERE s."userId" = u.id
              ) AS "lastLoginAt"
       FROM "user" u
       WHERE COALESCE(u.role, '') IN ('administrator', 'staff', 'web_manager', 'viewer')
       ORDER BY u."createdAt" DESC`,
    );

    const out: AdminUserRow[] = [];
    for (const u of rows) {
      const role = normalizeAppRole(u.role);
      const permissions =
        role === "administrator" ? emptyPermissions() : await loadUserPermissions(u.id);
      out.push({
        id: u.id,
        email: u.email,
        fullName: u.name,
        status: normalizeStatus(u.status),
        role,
        roleLabel: normalizeRoleLabel(role, u.roleLabel),
        permissions,
        permissionsSummary:
          role === "administrator" ? "Full access" : summarizePermissions(permissions),
        lastLoginAt: u.lastLoginAt ? asIso(u.lastLoginAt) : null,
        createdAt: asIso(u.createdAt),
        updatedAt: asIso(u.updatedAt),
      });
    }
    return out;
  });

export const recordLoginTimestamp = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await ensureUserStatusColumn();
    const { rows } = await dbQuery<{ status: string | null }>(
      "recordLoginTimestamp",
      `SELECT status FROM "user" WHERE id = $1`,
      [context.userId],
    );
    return { status: normalizeStatus(rows[0]?.status) };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (d: {
      email: string;
      fullName: string;
      role: AppRole;
      roleLabel?: string;
      status: UserStatus;
      password: string;
      permissions?: Partial<Record<ContentSection, ContentAccess>> | PermissionsMap;
      redirectTo?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertActiveAdministrator(context);
    await ensureUserStatusColumn();
    await ensureRoleLabelColumn();
    await ensureContentPermissionsSchema();

    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
    if (!data.fullName.trim()) throw new Error("Full name is required");
    if (data.role !== "administrator" && data.role !== "staff") throw new Error("Invalid role");
    if (!["active", "inactive", "suspended"].includes(data.status)) {
      throw new Error("Invalid status");
    }
    const password = assertValidAdminPassword(data.password);

    const roleLabel = sanitizeRoleLabelInput(data.role, data.roleLabel);
    const perms = sanitizePermissionsInput(data.permissions, data.role);
    if (data.role === "staff") {
      const hasAny = ASSIGNABLE_SECTIONS.some((s) => perms[s] !== "none");
      if (!hasAny) throw new Error("Assign at least one content permission for staff users");
    }

    const existing = await dbQuery<{ id: string; status: string | null }>(
      "inviteUser.exists",
      `SELECT id, status FROM "user" WHERE lower(email) = $1 LIMIT 1`,
      [email],
    );
    if (existing.rows[0]) {
      if (normalizeStatus(existing.rows[0].status) === "suspended") {
        await hardDeleteAuthUser(existing.rows[0].id);
      } else {
        throw new Error("A user with that email already exists");
      }
    }

    const userId = await createAuthUserWithoutSession({
      email,
      name: data.fullName.trim(),
      password,
      role: data.role,
      roleLabel,
      status: data.status,
    });

    if (data.role === "staff") {
      await replaceUserPermissions(userId, perms);
    }

    await writeUserAudit(context, {
      action: "user_invited",
      targetUserId: userId,
      summary: `Created ${email} as ${roleLabel} (${data.status})`,
      newValue: {
        email,
        role: data.role,
        roleLabel,
        status: data.status,
        fullName: data.fullName,
        permissions: data.role === "staff" ? perms : "full",
      },
    });

    return { id: userId, ok: true };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (d: {
      id: string;
      fullName?: string;
      status?: UserStatus;
      role?: AppRole;
      roleLabel?: string;
      permissions?: Partial<Record<ContentSection, ContentAccess>> | PermissionsMap;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertActiveAdministrator(context);
    await ensureUserStatusColumn();
    await ensureRoleLabelColumn();
    await ensureContentPermissionsSchema();

    const { rows } = await dbQuery<{
      id: string;
      email: string | null;
      name: string | null;
      role: string | null;
      roleLabel: string | null;
      status: string | null;
    }>(
      "updateUser.select",
      `SELECT id, email, name, role, role_label AS "roleLabel", status FROM "user" WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    if (!existing) throw new Error("User not found");

    const wasAdmin = existing.role === "administrator";
    const currentStatus = normalizeStatus(existing.status);
    const currentRole = normalizeAppRole(existing.role);

    if (data.role && data.role !== "administrator" && data.role !== "staff") {
      throw new Error("Invalid role");
    }

    if (data.id === context.userId) {
      if (data.role && data.role !== "administrator" && wasAdmin) {
        throw new Error("You cannot demote your own administrator account.");
      }
      if (data.status && data.status !== "active") {
        throw new Error("You cannot deactivate or suspend your own account.");
      }
    }

    const nextRole = data.role ?? currentRole ?? "staff";
    const willDemote = wasAdmin && data.role && data.role !== "administrator";
    const willDeactivate =
      wasAdmin && data.status && data.status !== "active" && currentStatus === "active";
    if (willDemote || willDeactivate) {
      const count = await countActiveAdministrators(data.id);
      if (count < 1) {
        throw new Error("Cannot remove the last active administrator.");
      }
    }

    if (typeof data.fullName === "string") {
      await pool.query(`UPDATE "user" SET name = $1, "updatedAt" = now() WHERE id = $2`, [
        data.fullName.trim(),
        data.id,
      ]);
    }
    if (data.status) {
      await pool.query(`UPDATE "user" SET status = $1, "updatedAt" = now() WHERE id = $2`, [
        data.status,
        data.id,
      ]);
      if (data.status !== "active") {
        await pool.query(`DELETE FROM session WHERE "userId" = $1`, [data.id]).catch(() => undefined);
      }
    }
    if (data.role) {
      await pool.query(`UPDATE "user" SET role = $1, "updatedAt" = now() WHERE id = $2`, [
        data.role,
        data.id,
      ]);
    }

    if (data.roleLabel !== undefined || data.role) {
      const roleLabel = sanitizeRoleLabelInput(
        nextRole,
        data.roleLabel ?? existing.roleLabel ?? undefined,
      );
      await pool.query(`UPDATE "user" SET role_label = $1, "updatedAt" = now() WHERE id = $2`, [
        roleLabel,
        data.id,
      ]);
    }

    if (nextRole === "administrator") {
      await pool.query(`DELETE FROM user_content_permissions WHERE user_id = $1`, [data.id]);
      await pool.query(`UPDATE "user" SET role_label = 'Administrator', "updatedAt" = now() WHERE id = $1`, [
        data.id,
      ]);
    } else if (data.permissions || data.role === "staff") {
      const perms = sanitizePermissionsInput(
        data.permissions ?? (await loadUserPermissions(data.id)),
        "staff",
      );
      const hasAny = ASSIGNABLE_SECTIONS.some((s) => perms[s] !== "none");
      if (!hasAny) throw new Error("Assign at least one content permission for staff users");
      await replaceUserPermissions(data.id, perms);
    }

    await writeUserAudit(context, {
      action: "user_updated",
      targetUserId: data.id,
      summary: `Updated ${existing.email ?? data.id}`,
      previousValue: {
        fullName: existing.name,
        status: currentStatus,
        role: currentRole,
        roleLabel: existing.roleLabel,
      },
      newValue: {
        fullName: data.fullName,
        status: data.status,
        role: data.role,
        roleLabel: data.roleLabel,
        permissions: data.permissions,
      },
    });

    return { ok: true };
  });

async function hardDeleteAuthUser(userId: string) {
  const { rows: emailRows } = await pool.query<{ email: string | null }>(
    `SELECT email FROM "user" WHERE id = $1`,
    [userId],
  );
  const email = emailRows[0]?.email ?? null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM account WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM user_content_permissions WHERE user_id = $1`, [userId]).catch(
      () => undefined,
    );
    await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  if (email) {
    try {
      await pool.query(`DELETE FROM verification WHERE identifier = $1`, [email]);
    } catch {
      /* optional */
    }
  }
}

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertActiveAdministrator(context);
    await ensureUserStatusColumn();
    await ensureContentPermissionsSchema();

    if (data.id === context.userId) {
      throw new Error("You cannot delete your own account.");
    }

    const { rows } = await dbQuery<{
      id: string;
      email: string | null;
      name: string | null;
      role: string | null;
      status: string | null;
    }>(
      "deleteUser.select",
      `SELECT id, email, name, role, status FROM "user" WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    if (!existing) throw new Error("User not found");

    const currentStatus = normalizeStatus(existing.status);

    if (existing.role === "administrator" && currentStatus === "active") {
      const count = await countActiveAdministrators(data.id);
      if (count < 1) {
        throw new Error("Cannot delete the last active administrator.");
      }
    }

    await writeUserAudit(context, {
      action: "user_deleted",
      targetUserId: data.id,
      summary: `Permanently deleted ${existing.email ?? data.id}`,
      previousValue: {
        fullName: existing.name,
        status: currentStatus,
        role: normalizeAppRole(existing.role),
        email: existing.email,
      },
      newValue: null,
    });

    await hardDeleteAuthUser(data.id);
    return { ok: true };
  });

export const getMyAccessStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  if (!request?.headers) {
    return { authenticated: false as const };
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return { authenticated: false as const };
  }
  await ensureUserStatusColumn();
  const { rows } = await dbQuery<{ status: string | null; role: string | null }>(
    "getMyAccessStatus",
    `SELECT status, role FROM "user" WHERE id = $1`,
    [session.user.id],
  );
  const status = normalizeStatus(rows[0]?.status);
  const roleRaw = (rows[0]?.role ?? "").trim();
  const allowed = status === "active" && isStaffRole(roleRaw);
  return {
    authenticated: true as const,
    status,
    role: normalizeAppRole(roleRaw),
    allowed,
  };
});

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    await assertActiveAdministrator(context);
    const password = assertValidAdminPassword(data.password);

    const { rows } = await dbQuery<{ email: string | null }>(
      "setUserPassword.select",
      `SELECT email FROM "user" WHERE id = $1`,
      [data.id],
    );
    const email = rows[0]?.email;
    if (!email) throw new Error("User has no email on file");

    await setAccountPassword(data.id, password);
    await pool.query(`DELETE FROM session WHERE "userId" = $1`, [data.id]).catch(() => undefined);

    await writeUserAudit(context, {
      action: "user_password_set",
      targetUserId: data.id,
      summary: `Password set by administrator for ${email}`,
    });

    return { ok: true };
  });
