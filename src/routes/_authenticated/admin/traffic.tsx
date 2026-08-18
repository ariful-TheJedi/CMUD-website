import { createFileRoute } from "@tanstack/react-router";
import { TrafficDashboard } from "@/components/admin/TrafficDashboard";

export const Route = createFileRoute("/_authenticated/admin/traffic")({
  head: () => ({
    meta: [{ title: "Traffic — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: TrafficAdminPage,
});

function TrafficAdminPage() {
  return <TrafficDashboard />;
}
