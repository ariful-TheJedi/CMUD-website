import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Staff Sign In — CMUD" }, { name: "robots", content: "noindex" }],
  }),
  component: LegacyAuthRedirect,
});

function LegacyAuthRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const suffix = window.location.hash + window.location.search;
    window.location.replace(`/admin/login${suffix}`);
  }, []);
  return null;
}
