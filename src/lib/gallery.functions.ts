import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { asIso, dbQuery, parseJsonArray } from "@/lib/db-helpers";
import { pool } from "@/lib/db";

export type GalleryImage = {
  id: string;
  url: string;
  caption: string;
  altText: string;
  sortOrder: number;
  createdAt: string;
};

export type PublicAlbum = {
  id: string;
  title: string;
  caption: string;
  category: string;
  sortOrder: number;
  createdAt: string;
  images: GalleryImage[];
};

export type AdminAlbum = PublicAlbum & {
  isPublished: boolean;
};

export type AlbumInput = {
  id?: string;
  title: string;
  caption: string;
  category: string;
  isPublished: boolean;
  sortOrder: number;
};

export type ImageInput = {
  id: string;
  caption?: string;
  altText?: string;
};

export const GALLERY_UPLOAD_NAME = /^gallery-.+\.[a-z0-9]+$/i;
export const GALLERY_MEDIA_FOLDER = "gallery";

type AlbumJoinedRow = {
  id: string;
  title: string;
  caption: string;
  category: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string | Date;
  images: unknown;
};

const ALBUM_LIST_SQL = `
  SELECT
    a.id,
    a.title,
    a.caption,
    COALESCE(a.category, '') AS category,
    a.is_published AS "isPublished",
    a.sort_order AS "sortOrder",
    a.created_at AS "createdAt",
    COALESCE(
      json_agg(
        json_build_object(
          'id', i.id,
          'url', i.url,
          'caption', COALESCE(i.caption, ''),
          'altText', COALESCE(i.alt_text, ''),
          'sortOrder', i.sort_order,
          'createdAt', i.created_at
        )
        ORDER BY i.sort_order ASC
      ) FILTER (WHERE i.id IS NOT NULL),
      '[]'::json
    ) AS images
  FROM gallery_albums a
  LEFT JOIN gallery_images i ON i.album_id = a.id
`;

function normalizeAlbum(row: AlbumJoinedRow, includePublished: boolean): PublicAlbum | AdminAlbum {
  const images = parseJsonArray<GalleryImage>(row.images).map((img) => ({
    id: img.id,
    url: img.url ?? "",
    caption: img.caption ?? "",
    altText: img.altText ?? "",
    sortOrder: Number(img.sortOrder) || 0,
    createdAt: asIso(img.createdAt),
  }));
  const base: PublicAlbum = {
    id: row.id,
    title: row.title,
    caption: row.caption ?? "",
    category: row.category ?? "",
    sortOrder: Number(row.sortOrder) || 0,
    createdAt: asIso(row.createdAt),
    images,
  };
  if (includePublished) {
    return { ...base, isPublished: Boolean(row.isPublished) };
  }
  return base;
}

export const listPublicAlbums = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicAlbum[]> => {
    const { rows } = await dbQuery<AlbumJoinedRow>(
      "listPublicAlbums",
      `${ALBUM_LIST_SQL}
       WHERE a.is_published = true
       GROUP BY a.id
       ORDER BY a.sort_order ASC, a.created_at DESC`,
    );
    return rows.map((r) => normalizeAlbum(r, false) as PublicAlbum);
  },
);

export const listAllAlbumsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminAlbum[]> => {
    await assertSectionView(context, "gallery");
    const { rows } = await dbQuery<AlbumJoinedRow>(
      "listAllAlbumsAdmin",
      `${ALBUM_LIST_SQL}
       GROUP BY a.id
       ORDER BY a.sort_order ASC, a.created_at DESC`,
    );
    return rows.map((r) => normalizeAlbum(r, true) as AdminAlbum);
  });

export const upsertAlbumAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: AlbumInput) => input)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertSectionUpdate(context, "gallery");
    const status = data.isPublished ? "published" : "draft";
    const isPublished = status === "published";

    if (data.id) {
      const { rows } = await pool.query<{ id: string; title: string }>(
        `UPDATE gallery_albums SET
           title = $1, caption = $2, category = $3,
           is_published = $4, status = $5::content_status,
           sort_order = $6, updated_at = now()
         WHERE id = $7
         RETURNING id, title`,
        [data.title, data.caption, data.category, isPublished, status, data.sortOrder, data.id],
      );
      const row = rows[0];
      if (!row) throw new Error("Album not found");
      await writeAuditLog(context, {
        action: "gallery.album_updated",
        contentType: "gallery_album",
        contentId: row.id,
        summary: `Updated album "${row.title}"`,
      });
      return { id: row.id };
    }

    const { rows } = await pool.query<{ id: string; title: string }>(
      `INSERT INTO gallery_albums (
         title, caption, category, is_published, status, sort_order
       ) VALUES ($1, $2, $3, $4, $5::content_status, $6)
       RETURNING id, title`,
      [data.title, data.caption, data.category, isPublished, status, data.sortOrder],
    );
    const row = rows[0];
    await writeAuditLog(context, {
      action: "gallery.album_created",
      contentType: "gallery_album",
      contentId: row.id,
      summary: `Created album "${row.title}"`,
    });
    return { id: row.id };
  });

export const deleteAlbumAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "gallery");
    const { rows: imgs } = await pool.query<{ url: string }>(
      `SELECT url FROM gallery_images WHERE album_id = $1`,
      [data.id],
    );
    const { rows: albums } = await pool.query<{ title: string }>(
      `SELECT title FROM gallery_albums WHERE id = $1`,
      [data.id],
    );
    const existing = albums[0];
    await pool.query(`DELETE FROM gallery_albums WHERE id = $1`, [data.id]);
    if (imgs.length) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      for (const img of imgs) {
        await deletePublicMediaFile(img.url, GALLERY_MEDIA_FOLDER, GALLERY_UPLOAD_NAME);
      }
    }
    await writeAuditLog(context, {
      action: "gallery.album_deleted",
      contentType: "gallery_album",
      contentId: data.id,
      summary: `Deleted album "${existing?.title ?? data.id}"`,
    });
    return { ok: true };
  });

export const addAlbumImageAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      albumId: string;
      url: string;
      caption?: string;
      altText?: string;
      sortOrder?: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "gallery");
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO gallery_images (album_id, url, caption, alt_text, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.albumId, data.url, data.caption ?? "", data.altText ?? "", data.sortOrder ?? 0],
    );
    const row = rows[0];
    await writeAuditLog(context, {
      action: "gallery.image_uploaded",
      contentType: "gallery_image",
      contentId: row.id,
      summary: `Uploaded gallery image`,
    });
    return { id: row.id };
  });

export const updateAlbumImageAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: ImageInput) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "gallery");
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (data.caption !== undefined) {
      sets.push(`caption = $${i++}`);
      vals.push(data.caption);
    }
    if (data.altText !== undefined) {
      sets.push(`alt_text = $${i++}`);
      vals.push(data.altText);
    }
    if (sets.length === 0) return { ok: true };
    vals.push(data.id);
    await pool.query(`UPDATE gallery_images SET ${sets.join(", ")} WHERE id = $${i}`, vals);
    return { ok: true };
  });

export const deleteAlbumImageAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "gallery");
    const { rows } = await pool.query<{ url: string }>(
      `SELECT url FROM gallery_images WHERE id = $1`,
      [data.id],
    );
    const existing = rows[0];
    await pool.query(`DELETE FROM gallery_images WHERE id = $1`, [data.id]);
    if (existing?.url) {
      const { deletePublicMediaFile } = await import("@/lib/local-media.server");
      await deletePublicMediaFile(existing.url, GALLERY_MEDIA_FOLDER, GALLERY_UPLOAD_NAME);
    }
    return { ok: true };
  });

/** Upload gallery image into `public/media/gallery/`; path stored in DB. */
export const uploadGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { fileName: string; contentType: string; base64: string }) => input,
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertSectionUpdate(context, "gallery");
    const { savePublicMediaFile } = await import("@/lib/local-media.server");
    const url = await savePublicMediaFile({
      folder: GALLERY_MEDIA_FOLDER,
      filePrefix: "gallery-img",
      fileName: data.fileName,
      contentType: data.contentType,
      base64: data.base64,
      deletableNamePattern: GALLERY_UPLOAD_NAME,
      maxBytes: 8 * 1024 * 1024,
    });
    return { url };
  });
