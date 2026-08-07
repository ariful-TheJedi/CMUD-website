import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import type { Course, CourseMode } from "@/data/courses";
import {
  assertSectionView,
  assertSectionUpdate,
} from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { dbQuery, parseStringArray } from "@/lib/db-helpers";

export type CourseStatus = "draft" | "published" | "archived";

export type AdminCourseRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  duration: string;
  mode: string;
  eligibility: string;
  shortDescription: string;
  description: string;
  fee: number;
  discountFee: number;
  syllabus: string[];
  outcomes: string[];
  featured: boolean;
  isPublished: boolean;
  status: CourseStatus;
  sortOrder: number;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
};

export type CourseInput = Omit<AdminCourseRow, "id" | "isPublished"> & { id?: string };

/** Row shape after SQL aliases (camelCase). */
type CourseDbRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  duration: string;
  mode: string;
  eligibility: string;
  shortDescription: string;
  description: string;
  fee: number | string;
  discountFee: number | string;
  syllabus: unknown;
  outcomes: unknown;
  featured: boolean;
  isPublished: boolean;
  status: string;
  sortOrder: number;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const COURSE_SELECT = `
  id,
  slug,
  name,
  category,
  duration,
  mode,
  eligibility,
  short_description AS "shortDescription",
  description,
  fee,
  discount_fee AS "discountFee",
  COALESCE(syllabus, ARRAY[]::text[]) AS syllabus,
  COALESCE(outcomes, ARRAY[]::text[]) AS outcomes,
  featured,
  is_published AS "isPublished",
  status::text AS status,
  sort_order AS "sortOrder",
  COALESCE(image_url, '') AS "imageUrl",
  COALESCE(seo_title, '') AS "seoTitle",
  COALESCE(seo_description, '') AS "seoDescription"
`;

function toPublicMode(mode: string): CourseMode {
  const m = (mode ?? "").trim();
  const lower = m.toLowerCase();
  if (lower === "online") return "Online";
  if (lower === "onsite") return "Onsite";
  if (lower === "hybrid") return "Hybrid";
  if (m === "Hybrid, Onsite" || lower === "hybrid, onsite") return "Hybrid, Onsite";
  if (m === "Online" || m === "Onsite" || m === "Hybrid") return m;
  return (m || "Onsite") as CourseMode;
}

function normalizeCourse(r: CourseDbRow): AdminCourseRow {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category ?? "",
    duration: r.duration ?? "",
    mode: r.mode ?? "",
    eligibility: r.eligibility ?? "",
    shortDescription: r.shortDescription ?? "",
    description: r.description ?? "",
    fee: Number(r.fee) || 0,
    discountFee: Number(r.discountFee) || 0,
    syllabus: parseStringArray(r.syllabus),
    outcomes: parseStringArray(r.outcomes),
    featured: Boolean(r.featured),
    isPublished: Boolean(r.isPublished),
    status: (r.status as CourseStatus) ?? "draft",
    sortOrder: Number(r.sortOrder) || 0,
    imageUrl: r.imageUrl ?? "",
    seoTitle: r.seoTitle ?? "",
    seoDescription: r.seoDescription ?? "",
  };
}

function toPublic(r: AdminCourseRow): Course {
  return {
    slug: r.slug,
    name: r.name,
    category: r.category,
    duration: r.duration,
    mode: toPublicMode(r.mode),
    eligibility: r.eligibility,
    shortDescription: r.shortDescription,
    description: r.description,
    fee: r.fee,
    discountFee: r.discountFee,
    syllabus: r.syllabus,
    outcomes: r.outcomes,
    featured: r.featured,
    imageUrl: r.imageUrl,
  };
}

export const listPublicCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<Course[]> => {
    const { rows } = await dbQuery<CourseDbRow>(
      "listPublicCourses",
      `SELECT ${COURSE_SELECT}
       FROM courses
       WHERE is_published = true
       ORDER BY sort_order ASC, name ASC`,
    );
    return rows.map((r) => toPublic(normalizeCourse(r)));
  },
);

export const getPublicCourseBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<Course | null> => {
    const { rows } = await dbQuery<CourseDbRow>(
      "getPublicCourseBySlug",
      `SELECT ${COURSE_SELECT}
       FROM courses
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [data.slug],
    );
    return rows[0] ? toPublic(normalizeCourse(rows[0])) : null;
  });

export const listAllCoursesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminCourseRow[]> => {
    await assertSectionView(context, "courses");
    const { rows } = await dbQuery<CourseDbRow>(
      "listAllCoursesAdmin",
      `SELECT ${COURSE_SELECT}
       FROM courses
       ORDER BY sort_order ASC, name ASC`,
    );
    return rows.map(normalizeCourse);
  });

export const getCourseAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<AdminCourseRow | null> => {
    await assertSectionView(context, "courses");
    const { rows } = await dbQuery<CourseDbRow>(
      "getCourseAdmin",
      `SELECT ${COURSE_SELECT} FROM courses WHERE id = $1`,
      [data.id],
    );
    return rows[0] ? normalizeCourse(rows[0]) : null;
  });

export const upsertCourseAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: CourseInput) => input)
  .handler(async ({ data, context }): Promise<AdminCourseRow> => {
    try {
      return await upsertCourseAdminImpl(data, context);
    } catch (error) {
      console.error("DB Error in upsertCourseAdmin:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  });

async function upsertCourseAdminImpl(
  data: CourseInput,
  context: { userId: string; role?: string },
): Promise<AdminCourseRow> {
    await assertSectionUpdate(context, "courses");

    const cleanSlug = data.slug.trim().toLowerCase();
    if (!cleanSlug || !/^[a-z0-9-]+$/.test(cleanSlug)) {
      throw new Error("Slug must contain only lowercase letters, numbers, and dashes.");
    }

    const dup = data.id
      ? await dbQuery("upsertCourseAdmin.dup", `SELECT id FROM courses WHERE slug = $1 AND id <> $2`, [
          cleanSlug,
          data.id,
        ])
      : await dbQuery("upsertCourseAdmin.dup", `SELECT id FROM courses WHERE slug = $1`, [cleanSlug]);
    if (dup.rows.length > 0) {
      throw new Error(`Slug "${cleanSlug}" is already used by another course.`);
    }

    let status: CourseStatus = data.status;
    // Update access includes publish/archive (no longer admin-only).

    const isPublished = status === "published";
    const syllabus = parseStringArray(data.syllabus);
    const outcomes = parseStringArray(data.outcomes);
    const fee = Number(data.fee) || 0;
    const discountFee = Number(data.discountFee) || 0;
    const sortOrder = Number(data.sortOrder) || 0;
    const vals = [
      cleanSlug,
      data.name.trim(),
      data.category,
      data.duration ?? "",
      data.mode,
      data.eligibility ?? "",
      data.shortDescription ?? "",
      data.description ?? "",
      fee,
      discountFee,
      syllabus,
      outcomes,
      Boolean(data.featured),
      status,
      isPublished,
      sortOrder,
      data.imageUrl ?? "",
      data.seoTitle ?? "",
      data.seoDescription ?? "",
      context.userId,
    ];

    if (data.id) {
      const { rows } = await dbQuery<CourseDbRow>(
        "upsertCourseAdmin.update",
        `UPDATE courses SET
           slug=$1, name=$2, category=$3, duration=$4, mode=$5, eligibility=$6,
           short_description=$7, description=$8, fee=$9, discount_fee=$10,
           syllabus=$11::text[], outcomes=$12::text[], featured=$13, status=$14::content_status,
           is_published=$15, sort_order=$16, image_url=$17, seo_title=$18,
           seo_description=$19, updated_by=$20, updated_at=now()
         WHERE id=$21
         RETURNING ${COURSE_SELECT}`,
        [...vals, data.id],
      );
      const row = rows[0];
      if (!row) throw new Error("Course not found");
      const normalized = normalizeCourse(row);
      await writeAuditLog(context, {
        action: "course.updated",
        contentType: "course",
        contentId: normalized.id,
        summary: `Updated course "${normalized.name}"`,
        newValues: {
          slug: normalized.slug,
          name: normalized.name,
          status: normalized.status,
        },
      });
      return normalized;
    }

    const { rows } = await dbQuery<CourseDbRow>(
      "upsertCourseAdmin.insert",
      `INSERT INTO courses (
         slug, name, category, duration, mode, eligibility, short_description, description,
         fee, discount_fee, syllabus, outcomes, featured, status, is_published, sort_order,
         image_url, seo_title, seo_description, created_by, updated_by
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::text[],$12::text[],$13,$14::content_status,$15,$16,$17,$18,$19,$20,$20
       )
       RETURNING ${COURSE_SELECT}`,
      vals,
    );
    const normalized = normalizeCourse(rows[0]);
    await writeAuditLog(context, {
      action: "course.created",
      contentType: "course",
      contentId: normalized.id,
      summary: `Created course "${normalized.name}"`,
      newValues: { slug: normalized.slug, name: normalized.name, status: normalized.status },
    });
    return normalized;
}

export const setCourseStatusAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string; status: CourseStatus }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "courses");
    await dbQuery(
      "setCourseStatusAdmin",
      `UPDATE courses SET status=$1::content_status, is_published=$2, updated_at=now(), updated_by=$3
       WHERE id=$4`,
      [data.status, data.status === "published", context.userId, data.id],
    );
    return { ok: true };
  });

export const COURSE_UPLOAD_NAME = /^course-.+-\d+\.[a-z0-9]+$/i;
export const COURSE_MEDIA_FOLDER = "courses";

export const deleteCourseAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "courses");
    const { rows } = await dbQuery<{ name: string; imageUrl: string | null }>(
      "deleteCourseAdmin.select",
      `SELECT name, image_url AS "imageUrl" FROM courses WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    await dbQuery("deleteCourseAdmin.delete", `DELETE FROM courses WHERE id = $1`, [data.id]);
    if (existing?.imageUrl) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      await deletePublicMediaFile(existing.imageUrl, COURSE_MEDIA_FOLDER, COURSE_UPLOAD_NAME);
    }
    await writeAuditLog(context, {
      action: "course.deleted",
      contentType: "course",
      contentId: data.id,
      summary: `Deleted course "${existing?.name ?? data.id}"`,
    });
    return { ok: true };
  });

export const uploadCourseCover = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      fileName: string;
      contentType: string;
      base64: string;
      currentSlug?: string;
      previousUrl?: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertSectionUpdate(context, "courses");
    const { savePublicMediaFile } = await import("@/lib/local-media.server");
    const slug = (data.currentSlug || "course")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const url = await savePublicMediaFile({
      folder: COURSE_MEDIA_FOLDER,
      filePrefix: `course-${slug || "cover"}`,
      fileName: data.fileName,
      contentType: data.contentType,
      base64: data.base64,
      previousUrl: data.previousUrl,
      deletableNamePattern: COURSE_UPLOAD_NAME,
    });
    return { url };
  });

export const deleteCourseCover = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data, context }): Promise<{ deleted: boolean }> => {
    await assertSectionUpdate(context, "courses");
    const { deletePublicMediaFile } = await import("@/lib/local-media.server");
    const deleted = await deletePublicMediaFile(
      data.url,
      COURSE_MEDIA_FOLDER,
      COURSE_UPLOAD_NAME,
    );
    return { deleted };
  });
