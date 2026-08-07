import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { asIso, dbQuery, parseJsonArray } from "@/lib/db-helpers";
import { pool } from "@/lib/db";

export type NoticeCategory = {
  id: string;
  name: string;
  slug: string;
};

export type NoticeAttachment = {
  id?: string;
  fileUrl: string;
  fileName: string;
  displayName: string | null;
  sortOrder: number;
};

export type PublicNotice = {
  id: string;
  title: string;
  body: string;
  noticeDate: string;
  category: NoticeCategory | null;
  sortOrder: number;
  attachments: NoticeAttachment[];
};

export type AdminNotice = PublicNotice & {
  isPublished: boolean;
  createdAt: string;
};

export type NoticeInput = {
  id?: string;
  title: string;
  body: string;
  noticeDate: string;
  categoryId: string | null;
  isPublished: boolean;
  sortOrder: number;
  attachments: NoticeAttachment[];
};

export const NOTICE_ATTACHMENT_UPLOAD_NAME = /^notice-.+\.[a-z0-9]+$/i;
export const NOTICE_ATTACHMENT_FOLDER = "notice-attachment";

type NoticeJoinedRow = {
  id: string;
  title: string;
  body: string;
  noticeDate: string | Date;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string | Date;
  category: unknown;
  attachments: unknown;
};

const NOTICE_LIST_SQL = `
  SELECT
    n.id,
    n.title,
    COALESCE(n.body, '') AS body,
    n.notice_date AS "noticeDate",
    n.is_published AS "isPublished",
    n.sort_order AS "sortOrder",
    n.created_at AS "createdAt",
    CASE
      WHEN c.id IS NULL THEN NULL
      ELSE json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
    END AS category,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', a.id,
            'fileUrl', a.file_url,
            'fileName', a.file_name,
            'displayName', a.display_name,
            'sortOrder', a.sort_order
          )
          ORDER BY a.sort_order ASC
        )
        FROM notice_attachments a
        WHERE a.notice_id = n.id
      ),
      '[]'::json
    ) AS attachments
  FROM notices n
  LEFT JOIN notice_categories c ON c.id = n.category_id
`;

function normalizeNotice(row: NoticeJoinedRow, includeAdmin: boolean): PublicNotice | AdminNotice {
  const categoryRaw = row.category;
  const category =
    categoryRaw && typeof categoryRaw === "object"
      ? (categoryRaw as NoticeCategory)
      : null;
  const attachments = parseJsonArray<NoticeAttachment>(row.attachments).map((a) => ({
    id: a.id,
    fileUrl: a.fileUrl ?? "",
    fileName: a.fileName ?? "",
    displayName: a.displayName ?? null,
    sortOrder: Number(a.sortOrder) || 0,
  }));
  const noticeDate =
    row.noticeDate instanceof Date
      ? row.noticeDate.toISOString().slice(0, 10)
      : String(row.noticeDate).slice(0, 10);

  const base: PublicNotice = {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    noticeDate,
    category,
    sortOrder: Number(row.sortOrder) || 0,
    attachments,
  };
  if (includeAdmin) {
    return {
      ...base,
      isPublished: Boolean(row.isPublished),
      createdAt: asIso(row.createdAt),
    };
  }
  return base;
}

export const listPublicNotices = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicNotice[]> => {
    const { rows } = await dbQuery<NoticeJoinedRow>(
      "listPublicNotices",
      `${NOTICE_LIST_SQL}
       WHERE n.is_published = true
       ORDER BY n.notice_date DESC`,
    );
    return rows.map((r) => normalizeNotice(r, false) as PublicNotice);
  },
);

export const listCategoriesPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<NoticeCategory[]> => {
    const { rows } = await dbQuery<NoticeCategory>(
      "listCategoriesPublic",
      `SELECT id, name, slug FROM notice_categories ORDER BY name ASC`,
    );
    return rows;
  },
);

export const listAllNoticesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminNotice[]> => {
    await assertSectionView(context, "notices");
    const { rows } = await dbQuery<NoticeJoinedRow>(
      "listAllNoticesAdmin",
      `${NOTICE_LIST_SQL}
       ORDER BY n.notice_date DESC`,
    );
    return rows.map((r) => normalizeNotice(r, true) as AdminNotice);
  });

export const listCategoriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<NoticeCategory[]> => {
    await assertSectionView(context, "notices");
    const { rows } = await dbQuery<NoticeCategory>(
      "listCategoriesAdmin",
      `SELECT id, name, slug FROM notice_categories ORDER BY name ASC`,
    );
    return rows;
  });

export const createCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data, context }): Promise<NoticeCategory> => {
    await assertSectionUpdate(context, "notices");
    const name = data.name.trim();
    if (!name) throw new Error("Category name required");
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const { rows } = await pool.query<NoticeCategory>(
      `INSERT INTO notice_categories (name, slug) VALUES ($1, $2)
       RETURNING id, name, slug`,
      [name, slug],
    );
    return rows[0];
  });

export const deleteCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "notices");
    await pool.query(`DELETE FROM notice_categories WHERE id = $1`, [data.id]);
    return { ok: true };
  });

export const upsertNoticeAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: NoticeInput) => input)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertSectionUpdate(context, "notices");
    const status = data.isPublished ? "published" : "draft";
    const isPublished = status === "published";

    let noticeId: string;
    let previousUrls: string[] = [];

    if (data.id) {
      const { rows: prevAtts } = await pool.query<{ file_url: string }>(
        `SELECT file_url FROM notice_attachments WHERE notice_id = $1`,
        [data.id],
      );
      previousUrls = prevAtts.map((a) => a.file_url);

      const { rows } = await pool.query<{ id: string }>(
        `UPDATE notices SET
           title = $1, body = $2, notice_date = $3, category_id = $4,
           is_published = $5, status = $6::content_status, sort_order = $7,
           updated_at = now()
         WHERE id = $8
         RETURNING id`,
        [
          data.title,
          data.body,
          data.noticeDate,
          data.categoryId,
          isPublished,
          status,
          data.sortOrder,
          data.id,
        ],
      );
      const row = rows[0];
      if (!row) throw new Error("Notice not found");
      noticeId = row.id;
    } else {
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO notices (
           title, body, notice_date, category_id, is_published, status, sort_order
         ) VALUES ($1, $2, $3, $4, $5, $6::content_status, $7)
         RETURNING id`,
        [
          data.title,
          data.body,
          data.noticeDate,
          data.categoryId,
          isPublished,
          status,
          data.sortOrder,
        ],
      );
      noticeId = rows[0].id;
    }

    await pool.query(`DELETE FROM notice_attachments WHERE notice_id = $1`, [noticeId]);

    if (data.attachments.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      data.attachments.forEach((a, idx) => {
        const base = idx * 5;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`,
        );
        values.push(
          noticeId,
          a.fileUrl,
          a.fileName,
          a.displayName?.trim() || a.fileName || "",
          a.sortOrder ?? idx,
        );
      });
      await pool.query(
        `INSERT INTO notice_attachments (notice_id, file_url, file_name, display_name, sort_order)
         VALUES ${placeholders.join(", ")}`,
        values,
      );
    }

    const keep = new Set(data.attachments.map((a) => a.fileUrl));
    const { deletePublicAttachmentFile } = await import("@/lib/local-attachment.server");
    for (const url of previousUrls) {
      if (!keep.has(url)) {
        await deletePublicAttachmentFile(
          url,
          NOTICE_ATTACHMENT_FOLDER,
          NOTICE_ATTACHMENT_UPLOAD_NAME,
        );
      }
    }

    await writeAuditLog(context, {
      action: data.id ? "notice.updated" : "notice.created",
      contentType: "notice",
      contentId: noticeId,
      summary: `${data.id ? "Updated" : "Created"} notice "${data.title}"`,
    });

    return { id: noticeId };
  });

export const toggleNoticePublishedAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string; isPublished: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "notices");
    const status = data.isPublished ? "published" : "draft";
    await pool.query(
      `UPDATE notices SET
         is_published = $1,
         status = $2::content_status,
         updated_at = now()
       WHERE id = $3`,
      [data.isPublished, status, data.id],
    );
    return { ok: true };
  });

export const deleteNoticeAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "notices");
    const { rows: atts } = await pool.query<{ file_url: string }>(
      `SELECT file_url FROM notice_attachments WHERE notice_id = $1`,
      [data.id],
    );
    const { rows: notices } = await pool.query<{ title: string }>(
      `SELECT title FROM notices WHERE id = $1`,
      [data.id],
    );
    const existing = notices[0];
    await pool.query(`DELETE FROM notices WHERE id = $1`, [data.id]);
    if (atts.length) {
      const { deletePublicAttachmentFile } = await import("@/lib/local-attachment.server");
      for (const att of atts) {
        await deletePublicAttachmentFile(
          att.file_url,
          NOTICE_ATTACHMENT_FOLDER,
          NOTICE_ATTACHMENT_UPLOAD_NAME,
        );
      }
    }
    await writeAuditLog(context, {
      action: "notice.deleted",
      contentType: "notice",
      contentId: data.id,
      summary: `Deleted notice "${existing?.title ?? data.id}"`,
    });
    return { ok: true };
  });

/** Upload notice attachment into `public/attachment/notice-attachment/`; path stored in DB. */
export const uploadNoticeAttachment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { fileName: string; contentType: string; base64: string }) => input,
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ url: string; fileName: string }> => {
      await assertSectionUpdate(context, "notices");
      const { savePublicAttachmentFile } = await import("@/lib/local-attachment.server");
      return savePublicAttachmentFile({
        folder: NOTICE_ATTACHMENT_FOLDER,
        filePrefix: "notice",
        fileName: data.fileName,
        contentType: data.contentType || "application/octet-stream",
        base64: data.base64,
        deletableNamePattern: NOTICE_ATTACHMENT_UPLOAD_NAME,
        maxBytes: 20 * 1024 * 1024,
      });
    },
  );
