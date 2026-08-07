// Client-safe permission helpers from CurrentUserInfo section access.

import type { CurrentUserInfo } from "@/lib/admin-access.functions";
import {
  type ContentSection,
  canUpdateAccess,
  canViewAccess,
  canUpdateSection,
  canViewSection,
  sectionAccessOf,
} from "@/lib/content-access.shared";

export type Permission =
  | "users.manage"
  | "settings.manage"
  | "admissions.manage"
  | "courses.create"
  | "courses.edit"
  | "courses.publish"
  | "courses.delete"
  | "faculty.create"
  | "faculty.edit"
  | "faculty.publish"
  | "faculty.delete"
  | "gallery.create"
  | "gallery.edit"
  | "gallery.publish"
  | "gallery.delete"
  | "notices.create"
  | "notices.edit"
  | "notices.publish"
  | "notices.delete"
  | "testimonials.manage"
  | "testimonials.delete"
  | "faqs.manage"
  | "faqs.delete"
  | "education_aides.manage"
  | "education_aides.delete"
  | "certificates.manage"
  | "certificates.delete"
  | "audit_logs.view"
  | "home_page.manage"
  | "dashboard.view";

const SECTION_PERMISSIONS: Record<string, { section: ContentSection; need: "view" | "update" }> = {
  "users.manage": { section: "dashboard", need: "update" },
  "settings.manage": { section: "dashboard", need: "update" },
  "admissions.manage": { section: "admissions", need: "update" },
  "courses.create": { section: "courses", need: "update" },
  "courses.edit": { section: "courses", need: "update" },
  "courses.publish": { section: "courses", need: "update" },
  "courses.delete": { section: "courses", need: "update" },
  "faculty.create": { section: "faculty", need: "update" },
  "faculty.edit": { section: "faculty", need: "update" },
  "faculty.publish": { section: "faculty", need: "update" },
  "faculty.delete": { section: "faculty", need: "update" },
  "gallery.create": { section: "gallery", need: "update" },
  "gallery.edit": { section: "gallery", need: "update" },
  "gallery.publish": { section: "gallery", need: "update" },
  "gallery.delete": { section: "gallery", need: "update" },
  "notices.create": { section: "notices", need: "update" },
  "notices.edit": { section: "notices", need: "update" },
  "notices.publish": { section: "notices", need: "update" },
  "notices.delete": { section: "notices", need: "update" },
  "testimonials.manage": { section: "testimonials", need: "update" },
  "testimonials.delete": { section: "testimonials", need: "update" },
  "faqs.manage": { section: "faqs", need: "update" },
  "faqs.delete": { section: "faqs", need: "update" },
  "education_aides.manage": { section: "education_aides", need: "update" },
  "education_aides.delete": { section: "education_aides", need: "update" },
  "certificates.manage": { section: "certificates", need: "update" },
  "certificates.delete": { section: "certificates", need: "update" },
  "home_page.manage": { section: "home_page", need: "update" },
  "dashboard.view": { section: "dashboard", need: "view" },
  "audit_logs.view": { section: "dashboard", need: "view" },
};

export function permissionsFor(
  user: CurrentUserInfo | null | undefined,
): ReadonlySet<Permission> {
  if (!user?.hasAdminAccess) return new Set();
  if (user.isAdministrator) {
    return new Set<Permission>(Object.keys(SECTION_PERMISSIONS) as Permission[]);
  }

  const set = new Set<Permission>();
  for (const [perm, rule] of Object.entries(SECTION_PERMISSIONS) as [
    Permission,
    { section: ContentSection; need: "view" | "update" },
  ][]) {
    if (perm === "users.manage" || perm === "settings.manage") continue;
    const access = sectionAccessOf(user, rule.section);
    if (rule.need === "view" && canViewAccess(access)) set.add(perm);
    if (rule.need === "update" && canUpdateAccess(access)) set.add(perm);
  }
  return set;
}

export function hasPermission(
  user: CurrentUserInfo | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  if (user.isAdministrator) {
    return true;
  }
  if (permission === "users.manage" || permission === "settings.manage") return false;
  return permissionsFor(user).has(permission);
}

export function hasAnyPermission(
  user: CurrentUserInfo | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export { canUpdateSection, canViewSection, sectionAccessOf };
