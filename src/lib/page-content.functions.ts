import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { asIso, dbQuery, parseJsonObject } from "@/lib/db-helpers";
import type { HomePageContent } from "@/lib/home-content";
import { normalizeHomeContent } from "@/lib/home-content";

export type PageContentRecord = {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  pageData: HomePageContent;
  updatedAt: string;
};

export type PageContentInput = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  pageData: HomePageContent;
};

type PageContentDbRow = {
  id: string;
  title: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  pageData: unknown;
  updatedAt: Date | string;
};

const PAGE_SELECT = `
  id,
  title,
  slug,
  COALESCE(meta_title, '') AS "metaTitle",
  COALESCE(meta_description, '') AS "metaDescription",
  page_data AS "pageData",
  updated_at AS "updatedAt"
`;

function toRecord(r: PageContentDbRow): PageContentRecord {
  const pageData = normalizeHomeContent(
    parseJsonObject(r.pageData, {} as Record<string, unknown>),
  );
  return {
    id: r.id,
    title: r.title ?? "",
    slug: r.slug,
    metaTitle: r.metaTitle ?? "",
    metaDescription: r.metaDescription ?? "",
    pageData,
    updatedAt: asIso(r.updatedAt),
  };
}

/** Public home content from local Postgres `page_content`. */
export const getHomePageContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<PageContentRecord | null> => {
    const { rows } = await dbQuery<PageContentDbRow>(
      "getHomePageContent",
      `SELECT ${PAGE_SELECT}
       FROM page_content WHERE slug = 'home' LIMIT 1`,
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },
);

export const getPageContentAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PageContentRecord | null> => {
    await assertSectionView(context, "home_page");
    const { rows } = await dbQuery<PageContentDbRow>(
      "getPageContentAdmin",
      `SELECT ${PAGE_SELECT}
       FROM page_content WHERE slug = 'home' LIMIT 1`,
    );
    return rows[0] ? toRecord(rows[0]) : null;
  });

/** Save home CMS content to local Postgres `page_content`. */
export const updateHomePageContent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: PageContentInput) => input)
  .handler(async ({ data, context }): Promise<PageContentRecord> => {
    await assertSectionUpdate(context, "home_page");

    const title = data.title?.trim() || "Home Page";
    const metaTitle = data.metaTitle?.trim() || "";
    const metaDescription = data.metaDescription?.trim() || "";
    const pageData = normalizeHomeContent(data.pageData);

    const { rows } = await dbQuery<PageContentDbRow>(
      "updateHomePageContent",
      `INSERT INTO page_content (slug, title, meta_title, meta_description, page_data, updated_at)
       VALUES ('home', $1, $2, $3, $4::jsonb, now())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         page_data = EXCLUDED.page_data,
         updated_at = now()
       RETURNING ${PAGE_SELECT}`,
      [title, metaTitle || null, metaDescription || null, JSON.stringify(pageData)],
    );
    const row = rows[0];

    try {
      await writeAuditLog(context, {
        action: "page.updated",
        contentType: "page",
        contentId: row.id,
        summary: "Updated home page content",
        newValues: { slug: "home", title },
      });
    } catch (error) {
      console.error("DB Error in updateHomePageContent.audit:", error);
    }

    return toRecord(row);
  });

/** Upload a home CMS image into `public/media/home/` (no Supabase Storage). */
export const uploadHomePageImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      slot: "hero" | "handsOn";
      fileName: string;
      contentType: string;
      base64: string;
      previousUrl?: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertSectionUpdate(context, "home_page");
    const { saveHomeMediaToPublic } = await import("@/lib/home-cms-local.server");
    const url = await saveHomeMediaToPublic(data);
    return { url };
  });

/** Delete a previously uploaded home CMS image from `public/media/home/`. */
export const deleteHomePageImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data, context }): Promise<{ deleted: boolean }> => {
    await assertSectionUpdate(context, "home_page");
    const { deleteHomeMediaFromPublic } = await import("@/lib/home-cms-local.server");
    const deleted = await deleteHomeMediaFromPublic(data.url);
    return { deleted };
  });
