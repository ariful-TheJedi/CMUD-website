import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import type { AdmissionStatus } from "@/lib/admissions.functions";
import { pool } from "@/lib/db";

export type DashboardMetrics = {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalFaculty: number;
  galleryImages: number;
  pendingAdmissions: number | null;
  activeNotices: number;
  upcomingEvents: null;
};

export type RecentContentUpdate = {
  id: string;
  action: string;
  summary: string | null;
  contentType: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type RecentAdmission = {
  id: string;
  fullName: string;
  courseName: string;
  preferredBranch: string;
  submittedAt: string;
  status: AdmissionStatus;
};

async function countSql(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(sql, params);
  return Number(rows[0]?.count ?? 0);
}

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<DashboardMetrics> => {
    const info = await assertSectionView(context, "dashboard");

    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      totalFaculty,
      galleryImages,
      activeNotices,
    ] = await Promise.all([
      countSql(`SELECT COUNT(*)::text AS count FROM courses`),
      countSql(`SELECT COUNT(*)::text AS count FROM courses WHERE is_published = true`),
      countSql(`SELECT COUNT(*)::text AS count FROM courses WHERE is_published = false`),
      countSql(`SELECT COUNT(*)::text AS count FROM faculty`),
      countSql(`SELECT COUNT(*)::text AS count FROM gallery_images`),
      countSql(`SELECT COUNT(*)::text AS count FROM notices WHERE is_published = true`),
    ]);

    let pendingAdmissions: number | null = null;
    if (info.isAdministrator || (info.permissions?.admissions && info.permissions.admissions !== "none")) {
      pendingAdmissions = await countSql(
        `SELECT COUNT(*)::text AS count FROM admission_applications WHERE status = 'new'`,
      );
    }

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalFaculty,
      galleryImages,
      pendingAdmissions,
      activeNotices,
      upcomingEvents: null,
    };
  });

export const getRecentContentUpdates = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<RecentContentUpdate[]> => {
    await assertSectionView(context, "dashboard");

    const { rows } = await pool.query<{
      id: string;
      action: string;
      summary: string | null;
      content_type: string | null;
      actor_id: string | null;
      created_at: string;
    }>(
      `SELECT id, action, summary, content_type, actor_id, created_at
       FROM audit_logs
       WHERE content_type IS NOT NULL AND content_type <> ''
       ORDER BY created_at DESC
       LIMIT 10`,
    );

    const actorIds = Array.from(
      new Set(rows.map((r) => r.actor_id).filter(Boolean)),
    ) as string[];
    let emailById = new Map<string, string>();
    if (actorIds.length) {
      const { rows: users } = await pool.query<{ id: string; email: string }>(
        `SELECT id, email FROM "user" WHERE id = ANY($1::text[])`,
        [actorIds],
      );
      emailById = new Map(users.map((u) => [u.id, u.email ?? ""]));
    }

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      summary: r.summary,
      contentType: r.content_type,
      actorEmail: r.actor_id ? (emailById.get(r.actor_id) ?? null) : null,
      createdAt: r.created_at,
    }));
  });

export const getRecentAdmissionApplications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<RecentAdmission[]> => {
    await assertSectionView(context, "admissions");
    const { rows } = await pool.query<{
      id: string;
      full_name: string;
      course_name: string;
      preferred_branch: string;
      submitted_at: string;
      status: AdmissionStatus;
    }>(
      `SELECT id, full_name, course_name, preferred_branch, submitted_at, status
       FROM admission_applications
       ORDER BY submitted_at DESC
       LIMIT 5`,
    );
    return rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      courseName: r.course_name,
      preferredBranch: r.preferred_branch,
      submittedAt: r.submitted_at,
      status: r.status,
    }));
  });
