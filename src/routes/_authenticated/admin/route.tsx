import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getCurrentUser } from "@/lib/admin-access.functions";
import { canViewSection, sectionFromPathname } from "@/lib/content-access.shared";
import { authClient } from "@/lib/auth-client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    let info;
    try {
      info = await getCurrentUser({});
    } catch {
      throw redirect({
        to: "/admin/login",
        search: {
          redirect: `${location.pathname}${location.searchStr || ""}`.startsWith("/admin")
            ? `${location.pathname}${location.searchStr || ""}`
            : "/admin/dashboard",
        },
      });
    }
    if (!info.hasAdminAccess) {
      try {
        await authClient.signOut();
      } catch {
        // ignore
      }
      throw redirect({ to: "/admin/login" });
    }

    const section = sectionFromPathname(location.pathname);
    if (section === "users" || section === "settings") {
      if (!info.isAdministrator) {
        throw redirect({ to: "/admin/dashboard" });
      }
    } else if (section) {
      if (!canViewSection(info, section)) {
        const fallback =
          (
            [
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
            ] as const
          ).find((s) => canViewSection(info, s)) ?? null;
        const pathMap: Record<string, string> = {
          dashboard: "/admin/dashboard",
          home_page: "/admin/home-page",
          courses: "/admin/courses",
          faculty: "/admin/faculty",
          gallery: "/admin/gallery",
          education_aides: "/admin/education-aides",
          notices: "/admin/notices",
          routines: "/admin/routines",
          events: "/admin/events",
          testimonials: "/admin/testimonials",
          faqs: "/admin/faqs",
          admissions: "/admin/admissions",
          certificates: "/admin/certificate-check",
        };
        throw redirect({ to: (fallback ? pathMap[fallback] : "/admin/login") as "/admin/dashboard" });
      }
    }

    return { currentUser: info };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (currentUser && !currentUser.hasAdminAccess && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.error("You do not have access to the admin area.");
      queryClient.clear();
      authClient.signOut().finally(() => {
        router.navigate({ to: "/admin/login", replace: true });
      });
    }
  }, [currentUser, router, queryClient]);

  const readOnly =
    !!currentUser &&
    !currentUser.isAdministrator &&
    !Object.values(currentUser.permissions ?? {}).some((a) => a === "update");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <AdminSidebar currentUser={currentUser} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex h-12 items-center gap-2 border-b bg-background px-3">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">CMUD Admin</div>
            {readOnly ? (
              <span className="ml-auto rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                Read-only access
              </span>
            ) : null}
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
