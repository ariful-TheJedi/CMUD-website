/**
 * Shared public-content loaders — Postgres only (Phase 3).
 * No static `src/data` or JSON fallbacks for CMS lists.
 */

import type { Course } from "@/data/courses";
import type { Instructor } from "@/data/faculty";
import {
  getPublicCourseBySlug as getPublicCourseBySlugFn,
  listPublicCourses,
} from "@/lib/courses.functions";
import { listPublicFaculty } from "@/lib/faculty.functions";
import { listPublicFaqs, type PublicFaq } from "@/lib/faqs.functions";
import { listPublicAlbums, type PublicAlbum } from "@/lib/gallery.functions";
import { listPublicNotices, type PublicNotice } from "@/lib/notices.functions";
import { listPublicTestimonials, type PublicTestimonial } from "@/lib/testimonials.functions";

export type PublicSource = "postgres";
export type PublicResult<T> = { data: T; source: PublicSource; error?: string };

function devLog(name: string, count: number, error?: string) {
  if (import.meta.env?.DEV) {
    console.info(
      `[public-content] ${name}: postgres (${count})${error ? ` — ${error}` : ""}`,
    );
  }
}

async function loadDb<T>(
  name: string,
  load: () => Promise<T>,
  size: (v: T) => number,
): Promise<PublicResult<T>> {
  try {
    const data = await load();
    devLog(name, size(data));
    return { data, source: "postgres" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[public-content] ${name} failed:`, message);
    throw err;
  }
}

export function getPublicCourses(): Promise<PublicResult<Course[]>> {
  return loadDb("courses", () => listPublicCourses(), (v) => v.length);
}

export async function getPublicCourseBySlug(slug: string): Promise<PublicResult<Course | null>> {
  try {
    const row = await getPublicCourseBySlugFn({ data: { slug } });
    devLog(`course:${slug}`, row ? 1 : 0);
    return { data: row, source: "postgres" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[public-content] course:${slug} failed:`, message);
    throw err;
  }
}

export function getPublicFaculty(): Promise<PublicResult<Instructor[]>> {
  return loadDb("faculty", () => listPublicFaculty(), (v) => v.length);
}

export function getPublicGallery(): Promise<PublicResult<PublicAlbum[]>> {
  return loadDb("gallery", () => listPublicAlbums(), (v) => v.length);
}

export function getPublicNotices(): Promise<PublicResult<PublicNotice[]>> {
  return loadDb("notices", () => listPublicNotices(), (v) => v.length);
}

export function getPublicFaqs(): Promise<PublicResult<PublicFaq[]>> {
  return loadDb("faqs", () => listPublicFaqs(), (v) => v.length);
}

export function getPublicTestimonials(): Promise<PublicResult<PublicTestimonial[]>> {
  return loadDb("testimonials", () => listPublicTestimonials(), (v) => v.length);
}
