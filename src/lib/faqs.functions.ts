import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { dbQuery } from "@/lib/db-helpers";

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
};

export type AdminFaqRow = PublicFaq & {
  isPublished: boolean;
  sortOrder: number;
};

export type FaqInput = Omit<AdminFaqRow, "id"> & { id?: string };

type FaqDbRow = {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
  status: string;
  sortOrder: number;
};

const FAQ_SELECT = `
  id,
  question,
  answer,
  is_published AS "isPublished",
  status::text AS status,
  sort_order AS "sortOrder"
`;

function toPublic(r: FaqDbRow): PublicFaq {
  return { id: r.id, question: r.question, answer: r.answer };
}

function toAdmin(r: FaqDbRow): AdminFaqRow {
  return {
    id: r.id,
    question: r.question,
    answer: r.answer,
    isPublished: Boolean(r.isPublished),
    sortOrder: Number(r.sortOrder) || 0,
  };
}

export const listPublicFaqs = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicFaq[]> => {
    const { rows } = await dbQuery<FaqDbRow>(
      "listPublicFaqs",
      `SELECT ${FAQ_SELECT}
       FROM faqs
       WHERE is_published = true
       ORDER BY sort_order ASC, created_at ASC`,
    );
    return rows.map(toPublic);
  },
);

export const listAllFaqsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminFaqRow[]> => {
    await assertSectionView(context, "faqs");
    const { rows } = await dbQuery<FaqDbRow>(
      "listAllFaqsAdmin",
      `SELECT ${FAQ_SELECT}
       FROM faqs
       ORDER BY sort_order ASC, created_at ASC`,
    );
    return rows.map(toAdmin);
  });

export const upsertFaqAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: FaqInput) => input)
  .handler(async ({ data, context }): Promise<AdminFaqRow> => {
    await assertSectionUpdate(context, "faqs");
    const isPublished = data.isPublished;
    const status = isPublished ? "published" : "draft";

    if (data.id) {
      const { rows } = await dbQuery<FaqDbRow>(
        "upsertFaqAdmin.update",
        `UPDATE faqs SET
           question = $1, answer = $2, is_published = $3,
           status = $4::content_status, sort_order = $5,
           updated_by = $6, updated_at = now()
         WHERE id = $7
         RETURNING ${FAQ_SELECT}`,
        [data.question, data.answer, isPublished, status, data.sortOrder, context.userId, data.id],
      );
      const row = rows[0];
      if (!row) throw new Error("FAQ not found");
      await writeAuditLog(context, {
        action: "faq.updated",
        contentType: "faq",
        contentId: row.id,
        summary: `Updated FAQ`,
        newValues: { question: row.question, is_published: row.isPublished },
      });
      return toAdmin(row);
    }

    const { rows } = await dbQuery<FaqDbRow>(
      "upsertFaqAdmin.insert",
      `INSERT INTO faqs (question, answer, is_published, status, sort_order, created_by, updated_by)
       VALUES ($1, $2, $3, $4::content_status, $5, $6, $6)
       RETURNING ${FAQ_SELECT}`,
      [data.question, data.answer, isPublished, status, data.sortOrder, context.userId],
    );
    const row = rows[0];
    await writeAuditLog(context, {
      action: "faq.created",
      contentType: "faq",
      contentId: row.id,
      summary: `Created FAQ`,
      newValues: { question: row.question, is_published: row.isPublished },
    });
    return toAdmin(row);
  });

export const deleteFaqAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "faqs");
    await dbQuery("deleteFaqAdmin", `DELETE FROM faqs WHERE id = $1`, [data.id]);
    await writeAuditLog(context, {
      action: "faq.deleted",
      contentType: "faq",
      contentId: data.id,
      summary: `Deleted FAQ`,
    });
    return { ok: true };
  });
