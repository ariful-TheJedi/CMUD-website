import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({
    meta: [{ title: "Events — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: EventsStubPage,
});

function EventsStubPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Events CMS module will be built in a follow-up phase. The route and access rules are
            already in place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
