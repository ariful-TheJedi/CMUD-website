import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { dbQuery } from "@/lib/db-helpers";
import { pool } from "@/lib/db";
import { toStoragePath } from "@/lib/assets";

export type PublicTestimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  initials: string;
  photoUrl: string;
};

export type AdminTestimonialRow = PublicTestimonial & {
  isPublished: boolean;
  sortOrder: number;
};

export type TestimonialInput = Omit<AdminTestimonialRow, "id"> & { id?: string };

type TestimonialDbRow = {
  id: string;
  name: string;
  role: string;
  quote: string;
  initials: string;
  photoUrl: string | null;
  isPublished: boolean;
  status: string;
  sortOrder: number;
};

export const TESTIMONIAL_UPLOAD_NAME = /^testimonial-.+-\d+\.[a-z0-9]+$/i;
export const TESTIMONIAL_MEDIA_FOLDER = "testimonials";

const TESTIMONIAL_SELECT = `
  id,
  name,
  role,
  quote,
  initials,
  COALESCE(photo_url, '') AS "photoUrl",
  is_published AS "isPublished",
  status::text AS status,
  sort_order AS "sortOrder"
`;

async function ensurePhotoColumn() {
  await pool.query(
    `ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT ''`,
  );
}

function toPublic(r: TestimonialDbRow): PublicTestimonial {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    quote: r.quote,
    initials: r.initials,
    photoUrl: toStoragePath(r.photoUrl ?? ""),
  };
}

function toAdmin(r: TestimonialDbRow): AdminTestimonialRow {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    quote: r.quote,
    initials: r.initials,
    photoUrl: toStoragePath(r.photoUrl ?? ""),
    isPublished: Boolean(r.isPublished),
    sortOrder: Number(r.sortOrder) || 0,
  };
}

export const listPublicTestimonials = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicTestimonial[]> => {
    await ensurePhotoColumn();
    const { rows } = await dbQuery<TestimonialDbRow>(
      "listPublicTestimonials",
      `SELECT ${TESTIMONIAL_SELECT}
       FROM testimonials
       WHERE is_published = true
       ORDER BY sort_order ASC, created_at ASC`,
    );
    return rows.map(toPublic);
  },
);

export const listAllTestimonialsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminTestimonialRow[]> => {
    await assertSectionView(context, "testimonials");
    await ensurePhotoColumn();
    const { rows } = await dbQuery<TestimonialDbRow>(
      "listAllTestimonialsAdmin",
      `SELECT ${TESTIMONIAL_SELECT}
       FROM testimonials
       ORDER BY sort_order ASC, created_at ASC`,
    );
    return rows.map(toAdmin);
  });

export const upsertTestimonialAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: TestimonialInput) => input)
  .handler(async ({ data, context }): Promise<AdminTestimonialRow> => {
    await assertSectionUpdate(context, "testimonials");
    await ensurePhotoColumn();
    const isPublished = data.isPublished;
    const status = isPublished ? "published" : "draft";
    const photoUrl = toStoragePath(data.photoUrl ?? "");

    if (data.id) {
      const { rows: prevRows } = await dbQuery<{ photoUrl: string | null }>(
        "upsertTestimonialAdmin.prevPhoto",
        `SELECT COALESCE(photo_url, '') AS "photoUrl" FROM testimonials WHERE id = $1`,
        [data.id],
      );
      const previousUrl = prevRows[0]?.photoUrl ?? "";

      const { rows } = await dbQuery<TestimonialDbRow>(
        "upsertTestimonialAdmin.update",
        `UPDATE testimonials SET
           name = $1, role = $2, quote = $3, initials = $4, photo_url = $5,
           is_published = $6, status = $7::content_status, sort_order = $8,
           updated_at = now()
         WHERE id = $9
         RETURNING ${TESTIMONIAL_SELECT}`,
        [
          data.name,
          data.role,
          data.quote,
          data.initials,
          photoUrl,
          isPublished,
          status,
          data.sortOrder,
          data.id,
        ],
      );
      const row = rows[0];
      if (!row) throw new Error("Testimonial not found");

      if (previousUrl && previousUrl !== photoUrl) {
        const { deletePublicMediaFile } = await import("@/lib/local-media.server");
        await deletePublicMediaFile(previousUrl, TESTIMONIAL_MEDIA_FOLDER, TESTIMONIAL_UPLOAD_NAME);
      }

      await writeAuditLog(context, {
        action: "testimonial.updated",
        contentType: "testimonial",
        contentId: row.id,
        summary: `Updated testimonial by "${row.name}"`,
        newValues: { name: row.name, role: row.role, is_published: row.isPublished },
      });
      return toAdmin(row);
    }

    const { rows } = await dbQuery<TestimonialDbRow>(
      "upsertTestimonialAdmin.insert",
      `INSERT INTO testimonials (
         name, role, quote, initials, photo_url, is_published, status, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::content_status, $8)
       RETURNING ${TESTIMONIAL_SELECT}`,
      [
        data.name,
        data.role,
        data.quote,
        data.initials,
        photoUrl,
        isPublished,
        status,
        data.sortOrder,
      ],
    );
    const row = rows[0];
    await writeAuditLog(context, {
      action: "testimonial.created",
      contentType: "testimonial",
      contentId: row.id,
      summary: `Created testimonial by "${row.name}"`,
      newValues: { name: row.name, role: row.role, is_published: row.isPublished },
    });
    return toAdmin(row);
  });

export const deleteTestimonialAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "testimonials");
    await ensurePhotoColumn();
    const { rows } = await dbQuery<{ name: string; photoUrl: string | null }>(
      "deleteTestimonialAdmin.select",
      `SELECT name, COALESCE(photo_url, '') AS "photoUrl" FROM testimonials WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    await dbQuery("deleteTestimonialAdmin.delete", `DELETE FROM testimonials WHERE id = $1`, [
      data.id,
    ]);
    if (existing?.photoUrl) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      await deletePublicMediaFile(
        existing.photoUrl,
        TESTIMONIAL_MEDIA_FOLDER,
        TESTIMONIAL_UPLOAD_NAME,
      );
    }
    await writeAuditLog(context, {
      action: "testimonial.deleted",
      contentType: "testimonial",
      contentId: data.id,
      summary: `Deleted testimonial by "${existing?.name ?? data.id}"`,
    });
    return { ok: true };
  });

/** Upload testimonial photo into ASSETS_ROOT/media/testimonials/. */
export const uploadTestimonialPhoto = createServerFn({ method: "POST" })
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
    await assertSectionUpdate(context, "testimonials");
    const { savePublicMediaFile } = await import("@/lib/local-media.server");
    const slug = (data.currentName || "person")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const url = await savePublicMediaFile({
      folder: TESTIMONIAL_MEDIA_FOLDER,
      filePrefix: `testimonial-${slug || "person"}`,
      fileName: data.fileName,
      contentType: data.contentType,
      base64: data.base64,
      previousUrl: data.previousUrl,
      deletableNamePattern: TESTIMONIAL_UPLOAD_NAME,
    });
    return { url };
  });
