/**
 * Compact traffic summary for the admin dashboard overview.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, ArrowRight, Clock, Eye, Users } from "lucide-react";

import { getTrafficSummary } from "@/lib/traffic.functions";
import { SOURCE_LABELS, type TrafficSource } from "@/lib/traffic.shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function TrafficSummaryCard() {
  const summaryFn = useServerFn(getTrafficSummary);
  const q = useQuery({
    queryKey: ["traffic-summary"],
    queryFn: () => summaryFn(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <Card className="transition hover:border-primary/40 hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Website traffic</CardTitle>
          {q.data && q.data.liveLast5Min > 0 ? (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </Badge>
          ) : null}
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/traffic">
            View details
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : q.isError ? (
          <p className="text-sm text-destructive">
            Failed to load traffic summary.{" "}
            <button type="button" className="underline" onClick={() => q.refetch()}>
              Retry
            </button>
          </p>
        ) : !q.data || (q.data.visitors30d === 0 && q.data.pageViews30d === 0) ? (
          <p className="text-sm text-muted-foreground">
            No visitor data yet for the last 30 days. Public page views will appear here
            automatically.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat
              icon={Users}
              label="Visitors (30d)"
              value={q.data.visitors30d.toLocaleString()}
            />
            <MiniStat
              icon={Eye}
              label="Page views"
              value={q.data.pageViews30d.toLocaleString()}
            />
            <MiniStat icon={Clock} label="Avg. session" value={q.data.avgSessionDurationLabel} />
            <MiniStat
              icon={Activity}
              label="Top source"
              value={
                SOURCE_LABELS[q.data.topSource as TrafficSource] ?? q.data.topSource
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
