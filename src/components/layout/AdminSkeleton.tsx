import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while the admin area's auth check / user data is still resolving.
 * These routes render nothing on the server (ssr: false), so without this
 * the whole admin shell would otherwise be a blank page for a beat.
 */
export function AdminSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-muted/20" aria-hidden="true">
      <div className="hidden w-64 shrink-0 flex-col gap-2 border-r bg-background p-3 md:flex">
        <Skeleton className="mb-4 h-8 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-2 border-b bg-background px-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="flex-1 space-y-4 p-4 md:p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
