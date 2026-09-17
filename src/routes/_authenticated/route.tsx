import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthSession } from "@/lib/auth.functions";
import { AdminSkeleton } from "@/components/layout/AdminSkeleton";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // No SSR content to show here, so skip the usual pending delay — go
  // straight to the skeleton instead of a blank page.
  pendingComponent: AdminSkeleton,
  pendingMs: 0,
  pendingMinMs: 150,
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession();
    if (!session?.user) {
      // Path-only redirect (not full URL) — avoids auth/search "Invalid input" / callback issues on VPS
      const redirectTo = `${location.pathname}${location.searchStr || ""}`;
      throw redirect({
        to: "/admin/login",
        search: { redirect: redirectTo.startsWith("/admin") ? redirectTo : "/admin/dashboard" },
      });
    }
    return { user: session.user };
  },
  component: () => <Outlet />,
});
