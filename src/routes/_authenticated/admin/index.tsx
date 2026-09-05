import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  component: AdminIndexRedirect,
});

/** Fallback UI while the redirect runs (avoids a blank /admin shell). */
function AdminIndexRedirect() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to dashboard…
    </div>
  );
}
