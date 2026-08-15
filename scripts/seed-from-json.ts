/**
 * Seed local Postgres CMS tables from `src/data/*` TypeScript modules.
 *
 * Usage: npm run seed:cms
 */
import { randomUUID } from "node:crypto";
import { courses } from "../src/data/courses";
import { facultySeed as faculty } from "./seed-data/faculty";
import { faqs } from "../src/data/faqs";
import { galleryItems } from "../src/data/gallery";
import { notices } from "../src/data/notices";
import { testimonials } from "../src/data/testimonials";
import { defaultHomeContent } from "../src/lib/home-content";
import { pool } from "../src/lib/db";

type Counts = { ok: number; fail: number };

function emptyCounts(): Counts {
  return { ok: 0, fail: 0 };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function seedFaculty(): Promise<Counts> {
  const counts = emptyCounts();
  for (let i = 0; i < faculty.length; i++) {
    const f = faculty[i];
    try {
      await pool.query(
        `INSERT INTO faculty (
           id, name, title, credentials, specialty, short_bio, full_bio, bio,
           initials, photo_url, alt_text, status, is_published, sort_order, updated_at
         ) VALUES (
           $1,$2,$3,$4,'',$5,$5,$5,$6,$7,$8,'published'::content_status,true,$9,now()
         )
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           title = EXCLUDED.title,
           credentials = EXCLUDED.credentials,
           short_bio = EXCLUDED.short_bio,
           full_bio = EXCLUDED.full_bio,
           bio = EXCLUDED.bio,
           initials = EXCLUDED.initials,
           photo_url = EXCLUDED.photo_url,
           alt_text = EXCLUDED.alt_text,
           status = EXCLUDED.status,
           is_published = EXCLUDED.is_published,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()`,
        [
          randomUUID(),
          f.name,
          f.title,
          f.credentials,
          f.bio,
          f.initials,
          f.photo ?? "",
          f.name,
          i,
        ],
      );
      counts.ok += 1;
    } catch (err) {
      counts.fail += 1;
      console.error(`  faculty fail (${f.name}):`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`faculty: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function seedCourses(): Promise<Counts> {
  const counts = emptyCounts();
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    try {
      await pool.query(
        `INSERT INTO courses (
           id, slug, name, category, duration, mode, eligibility,
           short_description, description, fee, discount_fee, syllabus, outcomes, whats_included,
           featured, status, is_published, sort_order, image_url, seo_title, seo_description,
           updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::text[],$13::text[],$14::text[],
           $15,'published'::content_status,true,$16,$17,'','',now()
         )
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           duration = EXCLUDED.duration,
           mode = EXCLUDED.mode,
           eligibility = EXCLUDED.eligibility,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description,
           fee = EXCLUDED.fee,
           discount_fee = EXCLUDED.discount_fee,
           syllabus = EXCLUDED.syllabus,
           outcomes = EXCLUDED.outcomes,
           whats_included = EXCLUDED.whats_included,
           featured = EXCLUDED.featured,
           status = EXCLUDED.status,
           is_published = EXCLUDED.is_published,
           sort_order = EXCLUDED.sort_order,
           image_url = EXCLUDED.image_url,
           updated_at = now()`,
        [
          randomUUID(),
          c.slug,
          c.name,
          c.category,
          c.duration,
          c.mode,
          c.eligibility,
          c.shortDescription,
          c.description,
          c.fee,
          c.discountFee,
          c.syllabus,
          c.outcomes,
          c.whatsIncluded,
          Boolean(c.featured),
          i,
          c.imageUrl ?? "",
        ],
      );
      counts.ok += 1;
    } catch (err) {
      counts.fail += 1;
      console.error(`  courses fail (${c.slug}):`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`courses: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function seedGallery(): Promise<Counts> {
  const counts = emptyCounts();
  for (let i = 0; i < galleryItems.length; i++) {
    const g = galleryItems[i];
    try {
      await pool.query(
        `INSERT INTO gallery_albums (
           id, title, caption, category, is_published, status, sort_order, updated_at
         ) VALUES (
           $1,$2,$3,'',true,'published'::content_status,$4,now()
         )
         ON CONFLICT (id) DO NOTHING`,
        [randomUUID(), g.title, g.caption, i],
      );
      counts.ok += 1;
    } catch (err) {
      counts.fail += 1;
      console.error(`  gallery fail (${g.title}):`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`gallery: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function seedNotices(): Promise<Counts> {
  const counts = emptyCounts();
  const categoryIds = new Map<string, string>();

  for (const n of notices) {
    if (!categoryIds.has(n.tag)) {
      const id = randomUUID();
      categoryIds.set(n.tag, id);
      try {
        await pool.query(
          `INSERT INTO notice_categories (id, name, slug)
           VALUES ($1,$2,$3)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [id, n.tag, slugify(n.tag)],
        );
      } catch (err) {
        // If slug conflict returned existing row, resolve id
        const { rows } = await pool.query<{ id: string }>(
          `SELECT id FROM notice_categories WHERE slug = $1`,
          [slugify(n.tag)],
        );
        if (rows[0]) categoryIds.set(n.tag, rows[0].id);
        else {
          counts.fail += 1;
          console.error(`  notice category fail (${n.tag}):`, err instanceof Error ? err.message : err);
        }
      }
    }
  }

  // Re-resolve category ids by slug (in case ON CONFLICT kept existing)
  for (const tag of categoryIds.keys()) {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM notice_categories WHERE slug = $1`,
      [slugify(tag)],
    );
    if (rows[0]) categoryIds.set(tag, rows[0].id);
  }

  for (let i = 0; i < notices.length; i++) {
    const n = notices[i];
    try {
      await pool.query(
        `INSERT INTO notices (
           id, title, body, notice_date, category_id, is_published, status, sort_order, updated_at
         ) VALUES (
           $1,$2,$3,$4::date,$5,true,'published'::content_status,$6,now()
         )`,
        [randomUUID(), n.title, n.body, n.date, categoryIds.get(n.tag) ?? null, i],
      );
      counts.ok += 1;
    } catch (err) {
      counts.fail += 1;
      console.error(`  notices fail (${n.title}):`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`notices: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function seedFaqs(): Promise<Counts> {
  const counts = emptyCounts();
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    try {
      await pool.query(
        `INSERT INTO faqs (
           id, question, answer, is_published, status, sort_order, updated_at
         ) VALUES (
           $1,$2,$3,true,'published'::content_status,$4,now()
         )`,
        [randomUUID(), f.q, f.a, i],
      );
      counts.ok += 1;
    } catch (err) {
      counts.fail += 1;
      console.error(`  faqs fail:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`faqs: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function seedTestimonials(): Promise<Counts> {
  const counts = emptyCounts();
  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    try {
      await pool.query(
        `INSERT INTO testimonials (
           id, name, role, quote, initials, is_published, status, sort_order
         ) VALUES (
           $1,$2,$3,$4,$5,true,'published'::content_status,$6
         )`,
        [randomUUID(), t.name, t.role, t.quote, t.initials, i],
      );
      counts.ok += 1;
    } catch (err) {
      counts.fail += 1;
      console.error(`  testimonials fail (${t.name}):`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`testimonials: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function seedHome(): Promise<Counts> {
  const counts = emptyCounts();
  try {
    await pool.query(
      `INSERT INTO page_content (id, slug, title, meta_title, meta_description, page_data, updated_at)
       VALUES ($1,'home','Home','','',$2::jsonb,now())
       ON CONFLICT (slug) DO UPDATE SET
         page_data = EXCLUDED.page_data,
         updated_at = now()`,
      [randomUUID(), JSON.stringify(defaultHomeContent)],
    );
    counts.ok = 1;
  } catch (err) {
    counts.fail = 1;
    console.error(`  home fail:`, err instanceof Error ? err.message : err);
  }
  console.log(`home: ${counts.ok} ok, ${counts.fail} fail`);
  return counts;
}

async function clearCmsTables() {
  // Idempotent re-seed: wipe CMS content tables, keep auth/users/etc.
  await pool.query(`
    TRUNCATE TABLE
      gallery_images,
      gallery_albums,
      notice_attachments,
      notices,
      notice_categories,
      education_aid_slides,
      education_aid_sections,
      faculty,
      courses,
      faqs,
      testimonials,
      page_content
    RESTART IDENTITY CASCADE
  `);
  console.log("cleared: CMS content tables");
}

async function main() {
  console.log("Seeding from src/data/* into local Postgres…");
  await clearCmsTables();

  const results = [
    await seedFaculty(),
    await seedCourses(),
    await seedGallery(),
    await seedNotices(),
    await seedFaqs(),
    await seedTestimonials(),
    await seedHome(),
  ];

  const totals = results.reduce(
    (acc, c) => ({ ok: acc.ok + c.ok, fail: acc.fail + c.fail }),
    emptyCounts(),
  );

  console.log("----");
  console.log(`Done. total ok=${totals.ok} fail=${totals.fail}`);
  console.log("Public loaders read Postgres via src/lib/db.ts — not src/data/.");

  await pool.end();
  if (totals.fail > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
