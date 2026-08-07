import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Settings — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: ({ context }) => {
    const info = (context as { currentUser?: { isAdministrator: boolean } }).currentUser;
    if (!info?.isAdministrator) {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: SettingsStubPage,
});

function SettingsStubPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Settings CMS module will be built in a follow-up phase. The route and access rules
            are already in place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
