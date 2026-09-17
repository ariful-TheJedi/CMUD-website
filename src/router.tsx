import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageSkeleton } from "./components/layout/PageSkeleton";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageSkeleton,
    // Skip the skeleton for quick loads; only show it once a navigation
    // is genuinely slow, then hold it long enough to avoid a flicker.
    defaultPendingMs: 300,
    defaultPendingMinMs: 400,
  });

  return router;
};
