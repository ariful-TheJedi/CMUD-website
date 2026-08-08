/**
 * Public CMS loaders — Postgres only via createServerFn handlers.
 * Do not read `public/cms/*.json` or `src/data/*` entity arrays at runtime.
 */

import type { Course } from "@/data/courses";
import {
  getPublicCourseBySlug as getPublicCourseBySlugFn,
  listPublicCourses,
} from "@/lib/courses.functions";
import { listPublicFaculty, type PublicFaculty } from "@/lib/faculty.functions";
import { listPublicFaqs, type PublicFaq } from "@/lib/faqs.functions";
import { listPublicAlbums, type PublicAlbum } from "@/lib/gallery.functions";
import { listPublicNotices, type PublicNotice } from "@/lib/notices.functions";
import { listPublicTestimonials, type PublicTestimonial } from "@/lib/testimonials.functions";

export type {
  Course,
  PublicFaculty,
  PublicFaq,
  PublicAlbum,
  PublicNotice,
  PublicTestimonial,
};

/** Direct DB call — preferred for route loaders / ensureQueryData. */
export const fetchPublicCourses = (): Promise<Course[]> => listPublicCourses();

export const fetchPublicCourseBySlug = (slug: string): Promise<Course | null> =>
  getPublicCourseBySlugFn({ data: { slug } });

export const fetchPublicFaculty = (): Promise<PublicFaculty[]> => listPublicFaculty();

export const fetchPublicGallery = (): Promise<PublicAlbum[]> => listPublicAlbums();

export const fetchPublicNotices = (): Promise<PublicNotice[]> => listPublicNotices();

export const fetchPublicFaqs = (): Promise<PublicFaq[]> => listPublicFaqs();

export const fetchPublicTestimonials = (): Promise<PublicTestimonial[]> =>
  listPublicTestimonials();
