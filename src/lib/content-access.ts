/**
 * Server-only content permission DB helpers.
 * Client code must import from `@/lib/content-access.shared` instead.
 */
import { pool } from "@/lib/db";
import { dbQuery } from "@/lib/db-helpers";
import {
  type ContentAccess,
  type ContentSection,
  type PermissionsMap,
  ASSIGNABLE_SECTIONS,
  emptyPermissions,
  normalizeAccess,
} from "@/lib/content-access.shared";

export * from "@/lib/content-access.shared";

let ensured = false;

export async function ensureContentPermissionsSchema(): Promise<void> {
  if (ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_content_permissions (
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      section TEXT NOT NULL,
      access TEXT NOT NULL CHECK (access IN ('none', 'view', 'update')),
      PRIMARY KEY (user_id, section)
    )
  `);
  await migrateLegacyRoles();
  ensured = true;
}

async function migrateLegacyRoles(): Promise<void> {
  const { rows: legacy } = await pool.query<{ id: string; role: string | null }>(
    `SELECT id, role FROM "user" WHERE role IN ('web_manager', 'viewer')`,
  );
  if (legacy.length === 0) return;

  for (const u of legacy) {
    const access: ContentAccess = u.role === "viewer" ? "view" : "update";
    for (const section of ASSIGNABLE_SECTIONS) {
      await pool.query(
        `INSERT INTO user_content_permissions (user_id, section, access)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, section) DO NOTHING`,
        [u.id, section, access],
      );
    }
  }

  await pool.query(
    `UPDATE "user" SET role = 'staff', "updatedAt" = now()
     WHERE role IN ('web_manager', 'viewer')`,
  );
}

export async function loadUserPermissions(userId: string): Promise<PermissionsMap> {
  await ensureContentPermissionsSchema();
  const map = emptyPermissions();
  const { rows } = await dbQuery<{ section: string; access: string }>(
    "loadUserPermissions",
    `SELECT section, access FROM user_content_permissions WHERE user_id = $1`,
    [userId],
  );
  for (const r of rows) {
    if ((ASSIGNABLE_SECTIONS as readonly string[]).includes(r.section)) {
      map[r.section as ContentSection] = normalizeAccess(r.access);
    }
  }
  return map;
}

export async function replaceUserPermissions(
  userId: string,
  permissions: Partial<Record<ContentSection, ContentAccess>> | PermissionsMap,
): Promise<void> {
  await ensureContentPermissionsSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM user_content_permissions WHERE user_id = $1`, [userId]);
    for (const section of ASSIGNABLE_SECTIONS) {
      const access = normalizeAccess(permissions[section] ?? "none");
      if (access === "none") continue;
      await client.query(
        `INSERT INTO user_content_permissions (user_id, section, access) VALUES ($1, $2, $3)`,
        [userId, section, access],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
