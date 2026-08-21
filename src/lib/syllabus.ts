/**
 * Shared syllabus shapes: flat module list OR semester → modules.
 * Persisted inside courses.details JSONB (not separate columns).
 */

export type SyllabusMode = "flat" | "semester";

export type SyllabusSemester = {
  /** e.g. "Semester 1" */
  label: string;
  modules: string[];
};

export function normalizeSyllabusMode(mode: unknown): SyllabusMode {
  return mode === "semester" ? "semester" : "flat";
}

export function normalizeSyllabusSemesters(value: unknown): SyllabusSemester[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label =
        typeof row.label === "string" && row.label.trim()
          ? row.label.trim()
          : `Semester ${i + 1}`;
      const modules = Array.isArray(row.modules)
        ? row.modules.map((m) => String(m ?? "").trim()).filter(Boolean)
        : [];
      return { label, modules };
    })
    .filter((s): s is SyllabusSemester => s != null);
}

/** Total module count for headings (flat or all semesters). */
export function syllabusModuleCount(
  mode: SyllabusMode,
  syllabus: string[],
  semesters: SyllabusSemester[],
): number {
  if (mode === "semester") {
    return semesters.reduce((n, s) => n + s.modules.length, 0);
  }
  return syllabus.length;
}

/** Flatten semester modules into a single list (kept in sync in DB for compat). */
export function flattenSemesterModules(semesters: SyllabusSemester[]): string[] {
  return semesters.flatMap((s) => s.modules);
}
