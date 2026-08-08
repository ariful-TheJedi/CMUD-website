import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { pool } from "@/lib/db";
import { dbQuery } from "@/lib/db-helpers";
export type FacultyStatus = "draft" | "published" | "archived";

export type AdminFacultyRow = {
  id: string;
  name: string;
  title: string;
  credentials: string;
  specialty: string;
  phone: string;
  shortBio: string;
  fullBio: string;
  initials: string;
  photoUrl: string;
  altText: string;
  isPublished: boolean;
  status: FacultyStatus;
  sortOrder: number;
};

/** Public faculty shape — same as admin minus phone / publish flags. */
export type PublicFaculty = {
  id: string;
  name: string;
  title: string;
  credentials: string;
  specialty: string;
  shortBio: string;
  fullBio: string;
  /** Combined bio for cards: fullBio || shortBio */
  bio: string;
  initials: string;
  photoUrl: string;
  /** Alias of photoUrl for FacultyPortrait */
  photo?: string;
  altText: string;
  sortOrder: number;
};

export type FacultyInput = Omit<AdminFacultyRow, "id" | "isPublished"> & { id?: string };

type FacultyDbRow = {
  id: string;
  name: string;
  title: string;
  credentials: string;
  specialty: string | null;
  phone: string | null;
  shortBio: string | null;
  fullBio: string | null;
  bio: string | null;
  initials: string;
  photoUrl: string | null;
  altText: string | null;
  isPublished: boolean;
  status: string;
  sortOrder: number;
};

const FACULTY_SELECT = `
  id,
  name,
  title,
  credentials,
  COALESCE(specialty, '') AS specialty,
  COALESCE(phone, '') AS phone,
  COALESCE(short_bio, '') AS "shortBio",
  COALESCE(full_bio, '') AS "fullBio",
  COALESCE(bio, '') AS bio,
  initials,
  COALESCE(photo_url, '') AS "photoUrl",
  COALESCE(alt_text, '') AS "altText",
  is_published AS "isPublished",
  status::text AS status,
  sort_order AS "sortOrder"
`;

/** Public pages never select phone — keep private contact out of visitor responses. */
const FACULTY_PUBLIC_SELECT = `
  id,
  name,
  title,
  credentials,
  COALESCE(specialty, '') AS specialty,
  '' AS phone,
  COALESCE(short_bio, '') AS "shortBio",
  COALESCE(full_bio, '') AS "fullBio",
  COALESCE(bio, '') AS bio,
  initials,
  COALESCE(photo_url, '') AS "photoUrl",
  COALESCE(alt_text, '') AS "altText",
  is_published AS "isPublished",
  status::text AS status,
  sort_order AS "sortOrder"
`;

async function ensurePhoneColumn() {
  await pool.query(
    `ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`,
  );
}

function normalizeFaculty(r: FacultyDbRow): AdminFacultyRow {
  return {
    id: r.id,
    name: r.name,
    title: r.title ?? "",
    credentials: r.credentials ?? "",
    specialty: r.specialty ?? "",
    phone: r.phone ?? "",
    shortBio: r.shortBio ?? "",
    fullBio: r.fullBio ?? "",
    initials: r.initials ?? "",
    photoUrl: r.photoUrl ?? "",
    altText: r.altText ?? "",
    isPublished: Boolean(r.isPublished),
    status: (r.status as FacultyStatus) ?? "draft",
    sortOrder: Number(r.sortOrder) || 0,
  };
}

function toPublic(r: AdminFacultyRow): PublicFaculty {
  const bio = r.fullBio || r.shortBio || "";
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    credentials: r.credentials,
    specialty: r.specialty,
    shortBio: r.shortBio,
    fullBio: r.fullBio,
    bio,
    initials: r.initials,
    photoUrl: r.photoUrl,
    photo: r.photoUrl || undefined,
    altText: r.altText,
    sortOrder: r.sortOrder,
  };
}

export const listPublicFaculty = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicFaculty[]> => {
    const { rows } = await dbQuery<FacultyDbRow>(
      "listPublicFaculty",
      `SELECT ${FACULTY_PUBLIC_SELECT}
       FROM faculty
       WHERE is_published = true
       ORDER BY sort_order ASC, name ASC`,
    );
    return rows.map((r) => toPublic(normalizeFaculty(r)));
  },
);

export const listAllFacultyAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminFacultyRow[]> => {
    await assertSectionView(context, "faculty");
    await ensurePhoneColumn();
    const { rows } = await dbQuery<FacultyDbRow>(
      "listAllFacultyAdmin",
      `SELECT ${FACULTY_SELECT}
       FROM faculty
       ORDER BY sort_order ASC, name ASC`,
    );
    return rows.map(normalizeFaculty);
  });

export const getFacultyAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<AdminFacultyRow | null> => {
    await assertSectionView(context, "faculty");
    await ensurePhoneColumn();
    const { rows } = await dbQuery<FacultyDbRow>(
      "getFacultyAdmin",
      `SELECT ${FACULTY_SELECT} FROM faculty WHERE id = $1`,
      [data.id],
    );
    return rows[0] ? normalizeFaculty(rows[0]) : null;
  });

export const upsertFacultyAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: FacultyInput) => input)
  .handler(async ({ data, context }): Promise<AdminFacultyRow> => {
    try {
      return await upsertFacultyAdminImpl(data, context);
    } catch (error) {
      console.error("DB Error in upsertFacultyAdmin:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  });

async function upsertFacultyAdminImpl(
  data: FacultyInput,
  context: { userId: string; role?: string },
): Promise<AdminFacultyRow> {
  await assertSectionUpdate(context, "faculty");
  await ensurePhoneColumn();

  let status: FacultyStatus = data.status;
  // Update access includes publish (no longer admin-only freeze).

  const isPublished = status === "published";
  const sortOrder = Number(data.sortOrder) || 0;
  const params = [
    data.name.trim(),
    data.title ?? "",
    data.credentials ?? "",
    data.specialty ?? "",
    (data.phone ?? "").trim(),
    data.shortBio ?? "",
    data.fullBio ?? "",
    data.fullBio || data.shortBio || "",
    data.initials ?? "",
    data.photoUrl ?? "",
    data.altText ?? "",
    status,
    isPublished,
    sortOrder,
    context.userId,
  ];

  if (data.id) {
    const { rows } = await dbQuery<FacultyDbRow>(
      "upsertFacultyAdmin.update",
      `UPDATE faculty SET
         name = $1, title = $2, credentials = $3, specialty = $4, phone = $5,
         short_bio = $6, full_bio = $7, bio = $8, initials = $9,
         photo_url = $10, alt_text = $11, status = $12::content_status,
         is_published = $13, sort_order = $14, updated_by = $15, updated_at = now()
       WHERE id = $16
       RETURNING ${FACULTY_SELECT}`,
      [...params, data.id],
    );
    const row = rows[0];
    if (!row) throw new Error("Faculty not found");
    const normalized = normalizeFaculty(row);
    await writeAuditLog(context, {
      action: "faculty.updated",
      contentType: "faculty",
      contentId: normalized.id,
      summary: `Updated faculty "${normalized.name}"`,
      newValues: { name: normalized.name, status: normalized.status },
    });
    return normalized;
  }

  const { rows } = await dbQuery<FacultyDbRow>(
    "upsertFacultyAdmin.insert",
    `INSERT INTO faculty (
       name, title, credentials, specialty, phone, short_bio, full_bio, bio, initials,
       photo_url, alt_text, status, is_published, sort_order, created_by, updated_by
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::content_status,$13,$14,$15,$15
     )
     RETURNING ${FACULTY_SELECT}`,
    params,
  );
  const normalized = normalizeFaculty(rows[0]);
  await writeAuditLog(context, {
    action: "faculty.created",
    contentType: "faculty",
    contentId: normalized.id,
    summary: `Created faculty "${normalized.name}"`,
    newValues: { name: normalized.name, status: normalized.status },
  });
  return normalized;
}

export const setFacultyStatusAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string; status: FacultyStatus }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "faculty");
    await dbQuery(
      "setFacultyStatusAdmin",
      `UPDATE faculty SET
         status = $1::content_status,
         is_published = $2,
         updated_at = now(),
         updated_by = $3
       WHERE id = $4`,
      [data.status, data.status === "published", context.userId, data.id],
    );
    return { ok: true };
  });

export const FACULTY_UPLOAD_NAME = /^faculty-.+-\d+\.[a-z0-9]+$/i;
export const FACULTY_MEDIA_FOLDER = "faculty";

export const deleteFacultyAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "faculty");
    const { rows } = await dbQuery<{ name: string; photoUrl: string | null }>(
      "deleteFacultyAdmin.select",
      `SELECT name, photo_url AS "photoUrl" FROM faculty WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    await dbQuery("deleteFacultyAdmin.delete", `DELETE FROM faculty WHERE id = $1`, [data.id]);
    if (existing?.photoUrl) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      await deletePublicMediaFile(existing.photoUrl, FACULTY_MEDIA_FOLDER, FACULTY_UPLOAD_NAME);
    }
    await writeAuditLog(context, {
      action: "faculty.deleted",
      contentType: "faculty",
      contentId: data.id,
      summary: `Deleted faculty "${existing?.name ?? data.id}"`,
    });
    return { ok: true };
  });

export const uploadFacultyPhoto = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      fileName: string;
      contentType: string;
      base64: string;
      currentName?: string;
      previousUrl?: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertSectionUpdate(context, "faculty");
    const { savePublicMediaFile } = await import("@/lib/local-media.server");
    const slug = (data.currentName || "faculty")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const url = await savePublicMediaFile({
      folder: FACULTY_MEDIA_FOLDER,
      filePrefix: `faculty-${slug || "member"}`,
      fileName: data.fileName,
      contentType: data.contentType,
      base64: data.base64,
      previousUrl: data.previousUrl,
      deletableNamePattern: FACULTY_UPLOAD_NAME,
    });
    return { url };
  });

export const deleteFacultyPhoto = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data, context }): Promise<{ deleted: boolean }> => {
    await assertSectionUpdate(context, "faculty");
    const { deletePublicMediaFile } = await import("@/lib/local-media.server");
    const deleted = await deletePublicMediaFile(
      data.url,
      FACULTY_MEDIA_FOLDER,
      FACULTY_UPLOAD_NAME,
    );
    return { deleted };
  });
