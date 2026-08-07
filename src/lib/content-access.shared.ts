/**
 * Client-safe content access types and helpers (no Node/pg imports).
 */
export type ContentAccess = "none" | "view" | "update";

export type ContentSection =
  | "dashboard"
  | "home_page"
  | "courses"
  | "faculty"
  | "gallery"
  | "education_aides"
  | "notices"
  | "routines"
  | "events"
  | "testimonials"
  | "faqs"
  | "admissions"
  | "certificates";

/** Sections an admin may grant to staff (not users/settings). */
export const ASSIGNABLE_SECTIONS: readonly ContentSection[] = [
  "dashboard",
  "home_page",
  "courses",
  "faculty",
  "gallery",
  "education_aides",
  "notices",
  "routines",
  "events",
  "testimonials",
  "faqs",
  "admissions",
  "certificates",
] as const;

export const SECTION_LABELS: Record<ContentSection, string> = {
  dashboard: "Dashboard",
  home_page: "Home Page",
  courses: "Courses",
  faculty: "Faculty",
  gallery: "Gallery",
  education_aides: "Education Aides",
  notices: "Notices",
  routines: "Routines",
  events: "Events",
  testimonials: "Testimonials",
  faqs: "FAQs",
  admissions: "Admissions",
  certificates: "Certificates",
};

/** Map admin route path prefix → section. */
export const ROUTE_SECTION: Record<string, ContentSection | "users" | "settings"> = {
  "/admin/dashboard": "dashboard",
  "/admin/home-page": "home_page",
  "/admin/courses": "courses",
  "/admin/faculty": "faculty",
  "/admin/gallery": "gallery",
  "/admin/education-aides": "education_aides",
  "/admin/notices": "notices",
  "/admin/routines": "routines",
  "/admin/events": "events",
  "/admin/testimonials": "testimonials",
  "/admin/faqs": "faqs",
  "/admin/admissions": "admissions",
  "/admin/certificate-check": "certificates",
  "/admin/users": "users",
  "/admin/settings": "settings",
};

export type AppRole = "administrator" | "staff";

export type PermissionsMap = Record<ContentSection, ContentAccess>;

export function emptyPermissions(): PermissionsMap {
  const m = {} as PermissionsMap;
  for (const s of ASSIGNABLE_SECTIONS) m[s] = "none";
  return m;
}

export function fullUpdatePermissions(): PermissionsMap {
  const m = {} as PermissionsMap;
  for (const s of ASSIGNABLE_SECTIONS) m[s] = "update";
  return m;
}

export function fullViewPermissions(): PermissionsMap {
  const m = {} as PermissionsMap;
  for (const s of ASSIGNABLE_SECTIONS) m[s] = "view";
  return m;
}

export function normalizeAccess(v: unknown): ContentAccess {
  if (v === "view" || v === "update" || v === "none") return v;
  return "none";
}

export function normalizeAppRole(v: unknown): AppRole | null {
  if (v === "administrator" || v === "staff") return v;
  if (v === "web_manager" || v === "viewer") return "staff";
  return null;
}

export function isStaffRole(role: string): boolean {
  return (
    role === "administrator" ||
    role === "staff" ||
    role === "web_manager" ||
    role === "viewer"
  );
}

export function accessRank(a: ContentAccess): number {
  if (a === "update") return 2;
  if (a === "view") return 1;
  return 0;
}

export function canViewAccess(a: ContentAccess): boolean {
  return accessRank(a) >= 1;
}

export function canUpdateAccess(a: ContentAccess): boolean {
  return accessRank(a) >= 2;
}

export function summarizePermissions(perms: PermissionsMap): string {
  let updates = 0;
  let views = 0;
  for (const s of ASSIGNABLE_SECTIONS) {
    if (perms[s] === "update") updates++;
    else if (perms[s] === "view") views++;
  }
  if (updates === 0 && views === 0) return "No content access";
  const parts: string[] = [];
  if (updates) parts.push(`${updates} update`);
  if (views) parts.push(`${views} view`);
  return parts.join(" · ");
}

export function sectionFromPathname(pathname: string): ContentSection | "users" | "settings" | null {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  const entries = Object.entries(ROUTE_SECTION).sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, section] of entries) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return section;
  }
  return null;
}

type AccessUser = {
  isAdministrator?: boolean;
  permissions?: Partial<PermissionsMap> | null;
} | null | undefined;

export function sectionAccessOf(user: AccessUser, section: ContentSection): ContentAccess {
  if (!user) return "none";
  if (user.isAdministrator) return "update";
  return user.permissions?.[section] ?? "none";
}

export function canViewSection(user: AccessUser, section: ContentSection): boolean {
  return canViewAccess(sectionAccessOf(user, section));
}

export function canUpdateSection(user: AccessUser, section: ContentSection): boolean {
  return canUpdateAccess(sectionAccessOf(user, section));
}
