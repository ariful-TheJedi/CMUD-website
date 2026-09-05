import { useCurrentUser } from "@/hooks/use-current-user";
import type { ContentSection } from "@/lib/content-access.shared";
import {
  canUpdateSection,
  canViewSection,
  sectionAccessOf,
} from "@/lib/content-access.shared";

/**
 * True when the user may update the given section (or any section if omitted — admin/staff with any update).
 */
export function useCanWrite(section?: ContentSection) {
  const { data } = useCurrentUser();
  if (!data) return false;
  if (data.isAdministrator) return true;
  if (section) return canUpdateSection(data, section);
  return Object.values(data.permissions ?? {}).some((a) => a === "update");
}

export function useSectionAccess(section: ContentSection) {
  const { data } = useCurrentUser();
  return sectionAccessOf(data, section);
}

export function useCanViewSection(section: ContentSection) {
  const { data } = useCurrentUser();
  return canViewSection(data, section);
}

/** True when the signed-in staff member has no update rights on any section. */
export function useIsViewer() {
  const { data } = useCurrentUser();
  return !!data && !data.isAdministrator && data.isViewer;
}
