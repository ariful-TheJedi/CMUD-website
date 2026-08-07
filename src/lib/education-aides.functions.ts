import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { asIso, dbQuery, parseJsonArray } from "@/lib/db-helpers";
import { pool } from "@/lib/db";

export type AidSlide = {
  id: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
};

export type PublicAidSection = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  slides: AidSlide[];
};

export type AdminAidSection = PublicAidSection & {
  isPublished: boolean;
  createdAt: string;
};

export type SectionInput = {
  id?: string;
  title: string;
  description: string;
  isPublished: boolean;
  sortOrder: number;
};

export const AID_UPLOAD_NAME = /^aid-.+\.[a-z0-9]+$/i;
export const AID_MEDIA_FOLDER = "education-aides";

type SectionJoinedRow = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string | Date;
  slides: unknown;
};

const SECTION_LIST_SQL = `
  SELECT
    s.id,
    s.title,
    COALESCE(s.description, '') AS description,
    s.is_published AS "isPublished",
    s.sort_order AS "sortOrder",
    s.created_at AS "createdAt",
    COALESCE(
      json_agg(
        json_build_object(
          'id', sl.id,
          'imageUrl', sl.image_url,
          'caption', COALESCE(sl.caption, ''),
          'sortOrder', sl.sort_order
        )
        ORDER BY sl.sort_order ASC
      ) FILTER (WHERE sl.id IS NOT NULL),
      '[]'::json
    ) AS slides
  FROM education_aid_sections s
  LEFT JOIN education_aid_slides sl ON sl.section_id = s.id
`;

function normalizeSection(row: SectionJoinedRow, includeAdmin: boolean): PublicAidSection | AdminAidSection {
  const slides = parseJsonArray<AidSlide>(row.slides).map((s) => ({
    id: s.id,
    imageUrl: s.imageUrl ?? "",
    caption: s.caption ?? "",
    sortOrder: Number(s.sortOrder) || 0,
  }));
  const base: PublicAidSection = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    sortOrder: Number(row.sortOrder) || 0,
    slides,
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

export const listPublicAidSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicAidSection[]> => {
    const { rows } = await dbQuery<SectionJoinedRow>(
      "listPublicAidSections",
      `${SECTION_LIST_SQL}
       WHERE s.is_published = true
       GROUP BY s.id
       ORDER BY s.sort_order ASC`,
    );
    return rows.map((r) => normalizeSection(r, false) as PublicAidSection);
  },
);

export const listAllAidSectionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminAidSection[]> => {
    await assertSectionView(context, "education_aides");
    const { rows } = await dbQuery<SectionJoinedRow>(
      "listAllAidSectionsAdmin",
      `${SECTION_LIST_SQL}
       GROUP BY s.id
       ORDER BY s.sort_order ASC`,
    );
    return rows.map((r) => normalizeSection(r, true) as AdminAidSection);
  });

export const upsertAidSectionAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: SectionInput) => input)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertSectionUpdate(context, "education_aides");
    if (data.id) {
      const { rows } = await pool.query<{ id: string }>(
        `UPDATE education_aid_sections SET
           title = $1, description = $2, is_published = $3, sort_order = $4, updated_at = now()
         WHERE id = $5
         RETURNING id`,
        [data.title, data.description, data.isPublished, data.sortOrder, data.id],
      );
      const row = rows[0];
      if (!row) throw new Error("Section not found");
      return { id: row.id };
    }
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO education_aid_sections (title, description, is_published, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [data.title, data.description, data.isPublished, data.sortOrder],
    );
    return { id: rows[0].id };
  });

export const deleteAidSectionAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "education_aides");
    const { rows: slides } = await pool.query<{ image_url: string }>(
      `SELECT image_url FROM education_aid_slides WHERE section_id = $1`,
      [data.id],
    );
    await pool.query(`DELETE FROM education_aid_sections WHERE id = $1`, [data.id]);
    if (slides.length) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      for (const slide of slides) {
        await deletePublicMediaFile(slide.image_url, AID_MEDIA_FOLDER, AID_UPLOAD_NAME);
      }
    }
    return { ok: true };
  });

export const addAidSlideAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { sectionId: string; imageUrl: string; caption?: string; sortOrder?: number }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "education_aides");
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO education_aid_slides (section_id, image_url, caption, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [data.sectionId, data.imageUrl, data.caption ?? "", data.sortOrder ?? 0],
    );
    return { id: rows[0].id };
  });

export const updateAidSlideAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string; caption?: string; sortOrder?: number }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "education_aides");
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.caption !== undefined) {
      params.push(data.caption);
      sets.push(`caption = $${params.length}`);
    }
    if (data.sortOrder !== undefined) {
      params.push(data.sortOrder);
      sets.push(`sort_order = $${params.length}`);
    }
    if (sets.length === 0) return { ok: true };
    params.push(data.id);
    await pool.query(
      `UPDATE education_aid_slides SET ${sets.join(", ")} WHERE id = $${params.length}`,
      params,
    );
    return { ok: true };
  });

export const deleteAidSlideAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "education_aides");
    const { rows } = await pool.query<{ image_url: string }>(
      `SELECT image_url FROM education_aid_slides WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    await pool.query(`DELETE FROM education_aid_slides WHERE id = $1`, [data.id]);
    if (existing?.image_url) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      await deletePublicMediaFile(existing.image_url, AID_MEDIA_FOLDER, AID_UPLOAD_NAME);
    }
    return { ok: true };
  });

/** Upload slide into `public/media/education-aides/`; path stored in DB. */
export const uploadAidSlideImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { fileName: string; contentType: string; base64: string }) => input,
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertSectionUpdate(context, "education_aides");
    const { savePublicMediaFile } = await import("@/lib/local-media.server");
    const url = await savePublicMediaFile({
      folder: AID_MEDIA_FOLDER,
      filePrefix: "aid-slide",
      fileName: data.fileName,
      contentType: data.contentType,
      base64: data.base64,
      deletableNamePattern: AID_UPLOAD_NAME,
      maxBytes: 8 * 1024 * 1024,
    });
    return { url };
  });
