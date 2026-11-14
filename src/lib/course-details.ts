/**
 * Flexible course-detail payload stored in courses.details (JSONB).
 * Add new UI fields here without new DB columns.
 */
import { parseJsonObject, parseStringArray } from "@/lib/db-helpers";
import {
  flattenSemesterModules,
  normalizeSyllabusMode,
  normalizeSyllabusSemesters,
  type SyllabusMode,
  type SyllabusSemester,
} from "@/lib/syllabus";

export type CourseDetails = {
  syllabusMode: SyllabusMode;
  /** Flat modules when syllabusMode === "flat" */
  syllabus: string[];
  syllabusSemesters: SyllabusSemester[];
  outcomes: string[];
  whatsIncluded: string[];
  /** One-time admission fee (BDT). 0 = not shown. */
  admissionFee: number;
  /** Multiple installment payment option available. */
  installmentsAvailable: boolean;
  imageUrls: string[];
  facultyIds: string[];
};

export const EMPTY_COURSE_DETAILS: CourseDetails = {
  syllabusMode: "flat",
  syllabus: [],
  syllabusSemesters: [],
  outcomes: [],
  whatsIncluded: [],
  admissionFee: 0,
  installmentsAvailable: false,
  imageUrls: [],
  facultyIds: [],
};

function toMoney(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

type LegacyDetailFields = {
  syllabus?: unknown;
  syllabusMode?: unknown;
  syllabusSemesters?: unknown;
  outcomes?: unknown;
  whatsIncluded?: unknown;
};

/** Prefer JSONB details; fall back to legacy columns during migration. */
export function resolveCourseDetails(
  detailsRaw: unknown,
  legacy: LegacyDetailFields = {},
): CourseDetails {
  const obj = parseJsonObject<Record<string, unknown>>(detailsRaw, {});
  const hasDetails =
    Object.keys(obj).length > 0 &&
    (obj.syllabus != null ||
      obj.syllabusMode != null ||
      obj.syllabusSemesters != null ||
      obj.outcomes != null ||
      obj.whatsIncluded != null ||
      obj.admissionFee != null ||
      obj.installmentsAvailable != null ||
      obj.imageUrls != null ||
      obj.facultyIds != null);

  if (hasDetails) {
    const mode = normalizeSyllabusMode(obj.syllabusMode);
    const semesters = normalizeSyllabusSemesters(obj.syllabusSemesters);
    const syllabus =
      mode === "semester"
        ? flattenSemesterModules(semesters)
        : parseStringArray(obj.syllabus);
    return {
      syllabusMode: mode,
      syllabus,
      syllabusSemesters: mode === "semester" ? semesters : [],
      outcomes: parseStringArray(obj.outcomes),
      whatsIncluded: parseStringArray(obj.whatsIncluded),
      admissionFee: toMoney(obj.admissionFee),
      installmentsAvailable: toBool(obj.installmentsAvailable),
      imageUrls: parseStringArray(obj.imageUrls),
      facultyIds: [...new Set(parseStringArray(obj.facultyIds).filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))],
    };
  }

  const mode = normalizeSyllabusMode(legacy.syllabusMode);
  const semesters = normalizeSyllabusSemesters(legacy.syllabusSemesters);
  return {
    syllabusMode: mode,
    syllabus:
      mode === "semester"
        ? flattenSemesterModules(semesters)
        : parseStringArray(legacy.syllabus),
    syllabusSemesters: mode === "semester" ? semesters : [],
    outcomes: parseStringArray(legacy.outcomes),
    whatsIncluded: parseStringArray(legacy.whatsIncluded),
    admissionFee: 0,
    installmentsAvailable: false,
    imageUrls: [],
    facultyIds: [],
  };
}

/** Build JSONB payload for upsert. */
export function buildCourseDetails(input: {
  syllabusMode?: SyllabusMode | string;
  syllabus?: string[];
  syllabusSemesters?: SyllabusSemester[];
  outcomes?: string[];
  whatsIncluded?: string[];
  admissionFee?: number;
  installmentsAvailable?: boolean;
  imageUrls?: string[];
  facultyIds?: string[];
}): CourseDetails {
  const mode = normalizeSyllabusMode(input.syllabusMode);
  const semesters =
    mode === "semester"
      ? normalizeSyllabusSemesters(input.syllabusSemesters)
      : [];
  return {
    syllabusMode: mode,
    syllabus:
      mode === "semester"
        ? flattenSemesterModules(semesters)
        : parseStringArray(input.syllabus),
    syllabusSemesters: semesters,
    outcomes: parseStringArray(input.outcomes),
    whatsIncluded: parseStringArray(input.whatsIncluded),
    admissionFee: toMoney(input.admissionFee),
    installmentsAvailable: Boolean(input.installmentsAvailable),
    imageUrls: parseStringArray(input.imageUrls),
    facultyIds: [...new Set(parseStringArray(input.facultyIds).filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))],
  };
}
