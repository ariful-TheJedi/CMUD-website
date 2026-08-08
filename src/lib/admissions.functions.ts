import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import {
  assertSectionView,
  assertSectionUpdate,
  type StaffContext,
} from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { asIso, dbQuery } from "@/lib/db-helpers";
// PAUSED — Cloudflare Turnstile
// import { verifyTurnstileToken } from "@/lib/turnstile";

export type AdmissionStatus = "new" | "contacted" | "admitted" | "rejected";

export type AdmissionApplicationListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bmdcNumber: string;
  courseName: string;
  courseSlug: string;
  preferredBranch: string;
  submittedAt: string;
  status: AdmissionStatus;
};

export type AdmissionApplicationDetail = AdmissionApplicationListItem & {
  qualification: string;
  medicalCollege: string;
  address: string;
  preferredBatch: string;
  applicantMessage: string | null;
  statusUpdatedAt: string | null;
  statusUpdatedBy: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type AdmissionNote = {
  id: string;
  note: string;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
};

export type AdmissionFilters = {
  search?: string;
  status?: AdmissionStatus | "all";
  courseSlug?: string | "all";
  branch?: string | "all";
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  pageSize?: number;
};

const BRANCHES = ["Panthapath", "Uttara"] as const;
const statusEnum = z.enum(["new", "contacted", "admitted", "rejected"]);

type AdmissionRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  bmdc_number: string;
  course_name: string;
  course_slug: string;
  preferred_branch: string;
  submitted_at: string | Date;
  status: string;
  qualification?: string;
  medical_college?: string;
  address?: string;
  preferred_batch?: string;
  applicant_message?: string | null;
  status_updated_at?: string | Date | null;
  status_updated_by?: string | null;
  reviewed_at?: string | Date | null;
  reviewed_by?: string | null;
};

function toListItem(r: AdmissionRow): AdmissionApplicationListItem {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    bmdcNumber: r.bmdc_number ?? "",
    courseName: r.course_name,
    courseSlug: r.course_slug ?? "",
    preferredBranch: r.preferred_branch ?? "",
    submittedAt: asIso(r.submitted_at),
    status: r.status as AdmissionStatus,
  };
}

function toDetail(r: AdmissionRow): AdmissionApplicationDetail {
  return {
    ...toListItem(r),
    qualification: r.qualification ?? "",
    medicalCollege: r.medical_college ?? "",
    address: r.address ?? "",
    preferredBatch: r.preferred_batch ?? "",
    applicantMessage: r.applicant_message ?? null,
    statusUpdatedAt: r.status_updated_at ? asIso(r.status_updated_at) : null,
    statusUpdatedBy: r.status_updated_by ?? null,
    reviewedAt: r.reviewed_at ? asIso(r.reviewed_at) : null,
    reviewedBy: r.reviewed_by ?? null,
  };
}

async function assertAdmissionsRead(ctx: StaffContext) {
  return assertSectionView(ctx, "admissions");
}

async function assertAdmissionsUpdate(ctx: StaffContext) {
  return assertSectionUpdate(ctx, "admissions");
}

// ---------- public submission ----------
const submitSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+\d\s()-]+$/, "Invalid phone"),
  qualification: z.string().trim().min(2).max(120),
  medicalCollege: z.string().trim().min(2).max(200),
  bmdcNumber: z.string().trim().min(2).max(60),
  preferredBranch: z.enum(BRANCHES),
  courseSlug: z.string().trim().min(1).max(120),
  preferredBatch: z.string().trim().min(1).max(60),
  address: z.string().trim().min(2).max(500),
  applicantMessage: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
  captchaToken: z.string().trim().min(10).max(4000),
});

export const submitAdmissionApplication = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof submitSchema>) => submitSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    try {
      // PAUSED — Cloudflare Turnstile verify (re-enable for production when asked)
      // await verifyTurnstileToken(data.captchaToken);

      const { rows: courses } = await dbQuery<{
        id: string;
        slug: string;
        name: string;
        is_published: boolean;
      }>(
        "submitAdmission.course",
        `SELECT id, slug, name, is_published
         FROM courses
         WHERE slug = $1
         LIMIT 1`,
        [data.courseSlug],
      );
      const course = courses[0];
      if (!course || !course.is_published) {
        throw new Error("Invalid course selection");
      }

      const sixtyAgo = new Date(Date.now() - 60_000).toISOString();
      const { rows: recent } = await dbQuery<{ id: string }>(
        "submitAdmission.dup",
        `SELECT id FROM admission_applications
         WHERE email = $1 AND course_slug = $2 AND submitted_at >= $3
         LIMIT 1`,
        [data.email, data.courseSlug, sixtyAgo],
      );
      if (recent.length > 0) return { ok: true };

      const message = data.applicantMessage?.trim() || "";
      await dbQuery(
        "submitAdmission.insert",
        `INSERT INTO admission_applications (
           full_name, email, phone, qualification, medical_college, bmdc_number,
           preferred_branch, course_id, course_slug, course_name, preferred_batch,
           address, applicant_message, message, status, submitted_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'new'::admission_status, now()
         )`,
        [
          data.fullName,
          data.email,
          data.phone,
          data.qualification,
          data.medicalCollege,
          data.bmdcNumber,
          data.preferredBranch,
          course.id,
          course.slug,
          course.name,
          data.preferredBatch,
          data.address,
          message || null,
          message,
        ],
      );
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      console.error("[admissions] submit failed:", err);
      if (msg === "Invalid course selection" || msg === "Captcha verification failed") {
        throw new Error(msg);
      }
      throw new Error("Submission failed. Please try again.");
    }
  });

// ---------- admin: list ----------
export const listAdmissionApplications = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: AdmissionFilters) => d ?? {})
  .handler(
    async ({
      data,
      context,
    }): Promise<{ items: AdmissionApplicationListItem[]; total: number }> => {
      await assertAdmissionsRead(context);
      const pageSize = Math.min(Math.max(data.pageSize ?? 25, 1), 100);
      const page = Math.max(data.page ?? 1, 1);
      const offset = (page - 1) * pageSize;

      const where: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      if (data.status && data.status !== "all") {
        where.push(`status = $${i++}::admission_status`);
        params.push(data.status);
      }
      if (data.courseSlug && data.courseSlug !== "all") {
        where.push(`course_slug = $${i++}`);
        params.push(data.courseSlug);
      }
      if (data.branch && data.branch !== "all") {
        where.push(`preferred_branch = $${i++}`);
        params.push(data.branch);
      }
      if (data.fromDate) {
        where.push(`submitted_at >= $${i++}`);
        params.push(data.fromDate);
      }
      if (data.toDate) {
        where.push(`submitted_at <= $${i++}`);
        params.push(data.toDate);
      }
      if (data.search?.trim()) {
        const s = `%${data.search.trim().replace(/[%,]/g, "")}%`;
        where.push(
          `(full_name ILIKE $${i} OR email ILIKE $${i} OR phone ILIKE $${i} OR bmdc_number ILIKE $${i})`,
        );
        params.push(s);
        i += 1;
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const countRes = await dbQuery<{ count: string }>(
        "listAdmissionApplications.count",
        `SELECT COUNT(*)::text AS count FROM admission_applications ${whereSql}`,
        params,
      );
      const total = Number(countRes.rows[0]?.count ?? 0);

      const listParams = [...params, pageSize, offset];
      const { rows } = await dbQuery<AdmissionRow>(
        "listAdmissionApplications.list",
        `SELECT id, full_name, email, phone, bmdc_number, course_name, course_slug,
                preferred_branch, submitted_at, status::text AS status
         FROM admission_applications
         ${whereSql}
         ORDER BY submitted_at DESC
         LIMIT $${i++} OFFSET $${i++}`,
        listParams,
      );

      return { items: rows.map(toListItem), total };
    },
  );

// ---------- admin: detail ----------
export const getAdmissionApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<AdmissionApplicationDetail | null> => {
    await assertAdmissionsRead(context);
    const { rows } = await dbQuery<AdmissionRow>(
      "getAdmissionApplication",
      `SELECT id, full_name, email, phone, bmdc_number, course_name, course_slug,
              preferred_branch, submitted_at, status::text AS status,
              qualification, medical_college, address, preferred_batch, applicant_message,
              status_updated_at, status_updated_by, reviewed_at, reviewed_by
       FROM admission_applications
       WHERE id = $1`,
      [data.id],
    );
    return rows[0] ? toDetail(rows[0]) : null;
  });

// ---------- admin: update status ----------
export const updateAdmissionStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; status: AdmissionStatus }) => ({
    id: z.string().uuid().parse(d.id),
    status: statusEnum.parse(d.status),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmissionsRead(context);
    const { rows: prevRows } = await dbQuery<{ status: string }>(
      "updateAdmissionStatus.prev",
      `SELECT status::text AS status FROM admission_applications WHERE id = $1`,
      [data.id],
    );
    const prev = prevRows[0];
    if (!prev) throw new Error("Application not found");

    if (data.status === "new") {
      await dbQuery(
        "updateAdmissionStatus.new",
        `UPDATE admission_applications SET
           status = $1::admission_status,
           status_updated_at = now(),
           status_updated_by = $2,
           updated_at = now()
         WHERE id = $3`,
        [data.status, context.userId, data.id],
      );
    } else {
      await dbQuery(
        "updateAdmissionStatus.set",
        `UPDATE admission_applications SET
           status = $1::admission_status,
           status_updated_at = now(),
           status_updated_by = $2,
           reviewed_at = now(),
           reviewed_by = $2,
           updated_at = now()
         WHERE id = $3`,
        [data.status, context.userId, data.id],
      );
    }

    await writeAuditLog(context, {
      action: "admission.status_changed",
      contentType: "admission_application",
      contentId: data.id,
      summary: `Admission status ${prev.status} → ${data.status}`,
      oldValues: { status: prev.status },
      newValues: { status: data.status },
    });
    return { ok: true };
  });

// ---------- admin: edit application ----------
const editSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(7).max(30),
  qualification: z.string().trim().min(2).max(120),
  medicalCollege: z.string().trim().min(2).max(200),
  bmdcNumber: z.string().trim().min(2).max(60),
  preferredBranch: z.enum(BRANCHES),
  preferredBatch: z.string().trim().min(1).max(60),
  address: z.string().trim().min(2).max(500),
  applicantMessage: z.string().trim().max(2000).nullable().optional(),
});

export const updateAdmissionApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: z.input<typeof editSchema>) => editSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmissionsUpdate(context);
    const message = data.applicantMessage?.trim() || "";
    await dbQuery(
      "updateAdmissionApplication",
      `UPDATE admission_applications SET
         full_name = $1, email = $2, phone = $3, qualification = $4,
         medical_college = $5, bmdc_number = $6, preferred_branch = $7,
         preferred_batch = $8, address = $9, applicant_message = $10,
         message = $10, updated_at = now()
       WHERE id = $11`,
      [
        data.fullName,
        data.email,
        data.phone,
        data.qualification,
        data.medicalCollege,
        data.bmdcNumber,
        data.preferredBranch,
        data.preferredBatch,
        data.address,
        message || null,
        data.id,
      ],
    );
    await writeAuditLog(context, {
      action: "admission.updated",
      contentType: "admission_application",
      contentId: data.id,
      summary: `Application details updated for ${data.fullName}`,
      newValues: { name: data.fullName },
    });
    return { ok: true };
  });

// ---------- admin: delete application ----------
export const deleteAdmissionApplication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => ({ id: z.string().uuid().parse(d.id) }))
  .handler(async ({ data, context }) => {
    await assertAdmissionsUpdate(context);
    const { rows: prevRows } = await dbQuery<{
      full_name: string;
      email: string;
      course_name: string;
    }>(
      "deleteAdmissionApplication.select",
      `SELECT full_name, email, course_name FROM admission_applications WHERE id = $1`,
      [data.id],
    );
    const prev = prevRows[0];
    await dbQuery(
      "deleteAdmissionApplication.delete",
      `DELETE FROM admission_applications WHERE id = $1`,
      [data.id],
    );
    await writeAuditLog(context, {
      action: "admission.deleted",
      contentType: "admission_application",
      contentId: data.id,
      summary: `Application deleted${prev?.full_name ? ` for ${prev.full_name}` : ""}`,
      oldValues: prev ? { name: prev.full_name } : null,
    });
    return { ok: true };
  });

// ---------- admin: notes ----------
export const listAdmissionNotes = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { applicationId: string }) => d)
  .handler(async ({ data, context }): Promise<AdmissionNote[]> => {
    await assertAdmissionsRead(context);
    const { rows } = await dbQuery<{
      id: string;
      body: string;
      created_by: string | null;
      created_at: string | Date;
      email: string | null;
      name: string | null;
    }>(
      "listAdmissionNotes",
      `SELECT n.id, n.body, n.created_by, n.created_at,
              u.email, u.name
       FROM admission_application_notes n
       LEFT JOIN "user" u ON u.id = n.created_by
       WHERE n.application_id = $1
       ORDER BY n.created_at DESC`,
      [data.applicationId],
    );
    return rows.map((n) => ({
      id: n.id,
      note: n.body,
      createdBy: n.created_by,
      createdByEmail: n.name || n.email || null,
      createdAt: asIso(n.created_at),
    }));
  });

export const addAdmissionNote = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { applicationId: string; note: string }) => ({
    applicationId: z.string().uuid().parse(d.applicationId),
    note: z.string().trim().min(2).max(2000).parse(d.note),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmissionsUpdate(context);
    await dbQuery(
      "addAdmissionNote",
      `INSERT INTO admission_application_notes (application_id, body, created_by)
       VALUES ($1, $2, $3)`,
      [data.applicationId, data.note, context.userId],
    );
    await writeAuditLog(context, {
      action: "admission.note_added",
      contentType: "admission_application",
      contentId: data.applicationId,
      summary: "Internal note added",
    });
    return { ok: true };
  });

// ---------- admin: dashboard stats ----------
export const getAdmissionDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmissionsRead(context);
    const pendingRes = await dbQuery<{ count: string }>(
      "getAdmissionDashboardStats.pending",
      `SELECT COUNT(*)::text AS count FROM admission_applications WHERE status = 'new'`,
    );
    const { rows: recent } = await dbQuery<{
      id: string;
      full_name: string;
      course_name: string;
      preferred_branch: string;
      submitted_at: string | Date;
      status: string;
    }>(
      "getAdmissionDashboardStats.recent",
      `SELECT id, full_name, course_name, preferred_branch, submitted_at, status::text AS status
       FROM admission_applications
       ORDER BY submitted_at DESC
       LIMIT 5`,
    );
    return {
      pending: Number(pendingRes.rows[0]?.count ?? 0),
      recent: recent.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        courseName: r.course_name,
        preferredBranch: r.preferred_branch,
        submittedAt: asIso(r.submitted_at),
        status: r.status as AdmissionStatus,
      })),
    };
  });
