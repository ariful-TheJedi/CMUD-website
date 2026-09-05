/**
 * Better Auth HTTP handler for TanStack Start.
 * Mounts sign-in / sign-out / session endpoints under /api/auth/*.
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
      POST: async ({ request }) => auth.handler(request),
    },
  },
});
