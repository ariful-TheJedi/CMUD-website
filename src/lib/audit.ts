// Reusable audit-log helper — writes to local Postgres audit_logs.

export type AuditAction =
  | "course.created"
  | "course.updated"
  | "course.published"
  | "course.unpublished"
  | "course.archived"
  | "course.deleted"
  | "faculty.created"
  | "faculty.updated"
  | "faculty.published"
  | "faculty.unpublished"
  | "faculty.archived"
  | "faculty.deleted"
  | "gallery.album_created"
  | "gallery.album_updated"
  | "gallery.album_archived"
  | "gallery.album_deleted"
  | "gallery.image_uploaded"
  | "gallery.image_updated"
  | "gallery.image_deleted"
  | "notice.created"
  | "notice.updated"
  | "notice.published"
  | "notice.unpublished"
  | "notice.archived"
  | "notice.deleted"
  | "testimonial.created"
  | "testimonial.updated"
  | "testimonial.deleted"
  | "faq.created"
  | "faq.updated"
  | "faq.deleted"
  | "certificate.created"
  | "certificate.updated"
  | "certificate.deleted"
  | "certificate.bulk_imported"
  | "admission.submitted"
  | "admission.status_changed"
  | "admission.updated"
  | "admission.deleted"
  | "admission.note_added"
  | "page.updated";

export type AuditContentType =
  | "course"
  | "faculty"
  | "gallery_album"
  | "gallery_image"
  | "notice"
  | "testimonial"
  | "faq"
  | "certificate"
  | "admission_application"
  | "page";

export type WriteAuditInput = {
  action: AuditAction;
  contentType: AuditContentType;
  contentId?: string | null;
  summary: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
};

export type AuditCtx = { userId: string };

const SAFE_FIELDS = new Set([
  "slug",
  "name",
  "title",
  "category",
  "status",
  "is_published",
  "featured",
  "sort_order",
  "fee",
  "discount_fee",
  "mode",
  "duration",
  "specialty",
  "credentials",
  "notice_date",
  "category_id",
  "question",
  "role",
  "photo_url",
]);

function sanitize(values?: Record<string, unknown> | null) {
  if (!values) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!SAFE_FIELDS.has(k)) continue;
    if (v === undefined) continue;
    if (typeof v === "string" && v.length > 200) out[k] = v.slice(0, 200);
    else out[k] = v as unknown;
  }
  return Object.keys(out).length ? out : null;
}

export async function writeAuditLog(ctx: AuditCtx, input: WriteAuditInput): Promise<void> {
  try {
    const { pool } = await import("@/lib/db");
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, content_type, content_id, summary, previous_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
      [
        ctx.userId,
        input.action,
        input.contentType,
        input.contentId ?? null,
        input.summary.slice(0, 240),
        JSON.stringify(sanitize(input.oldValues)),
        JSON.stringify(sanitize(input.newValues)),
      ],
    );
  } catch (err) {
    console.error("DB Error in writeAuditLog:", err);
  }
}
