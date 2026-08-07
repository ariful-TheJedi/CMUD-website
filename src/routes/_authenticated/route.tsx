import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession();
    if (!session?.user) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href },
      });
    }
    return { user: session.user };
  },
  component: () => <Outlet />,
});
