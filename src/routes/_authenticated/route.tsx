import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
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
