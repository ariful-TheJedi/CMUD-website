import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  GraduationCap,
  Users,
  Image as ImageIcon,
  Bell,
  Calendar,
  CalendarClock,
  Inbox,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { canViewSection } from "@/lib/content-access.shared";
import type { AdmissionStatus } from "@/lib/admissions.functions";
import {
  getDashboardMetrics,
  getRecentContentUpdates,
  getRecentAdmissionApplications,
  type DashboardMetrics,
} from "@/lib/dashboard.functions";
import { TrafficSummaryCard } from "@/components/admin/TrafficSummaryCard";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — CMUD" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardPage,
});

type MetricDef = {
  key: keyof DashboardMetrics | "upcomingEvents";
  label: string;
  icon: typeof GraduationCap;
  to: string;
  adminOnly?: boolean;
  disabled?: boolean;
};

const METRICS: MetricDef[] = [
  { key: "totalCourses", label: "Total courses", icon: GraduationCap, to: "/admin/courses" },
  {
    key: "publishedCourses",
    label: "Published courses",
    icon: GraduationCap,
    to: "/admin/courses",
  },
  { key: "draftCourses", label: "Draft courses", icon: FileText, to: "/admin/courses" },
  { key: "totalFaculty", label: "Total faculty", icon: Users, to: "/admin/faculty" },
  { key: "galleryImages", label: "Gallery images", icon: ImageIcon, to: "/admin/gallery" },
  {
    key: "pendingAdmissions",
    label: "Pending admissions",
    icon: Inbox,
    to: "/admin/admissions",
    adminOnly: true,
  },
  { key: "activeNotices", label: "Active notices", icon: Bell, to: "/admin/notices" },
  {
    key: "upcomingEvents",
    label: "Upcoming events",
    icon: Calendar,
    to: "/admin/dashboard",
    disabled: true,
  },
];

const QUICK_ACTIONS = [
  { label: "Add Course", to: "/admin/courses", icon: GraduationCap, disabled: false },
  { label: "Add Faculty", to: "/admin/faculty", icon: Users, disabled: false },
  { label: "Upload Gallery Image", to: "/admin/gallery", icon: ImageIcon, disabled: false },
  { label: "Add Notice", to: "/admin/notices", icon: Bell, disabled: false },
  { label: "Add Routine", to: "#", icon: CalendarClock, disabled: true },
  { label: "Add Event", to: "#", icon: Calendar, disabled: true },
];

const STATUS_STYLES: Record<AdmissionStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-amber-100 text-amber-900 border-amber-200",
  admitted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanizeAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const canSeeAdmissions = !!currentUser && canViewSection(currentUser, "admissions");
  const canSeeTraffic =
    !!currentUser &&
    (canViewSection(currentUser, "traffic") || canViewSection(currentUser, "dashboard"));

  const metricsFn = useServerFn(getDashboardMetrics);
  const updatesFn = useServerFn(getRecentContentUpdates);
  const admissionsFn = useServerFn(getRecentAdmissionApplications);

  const metricsQ = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => metricsFn(),
    staleTime: 30_000,
  });
  const updatesQ = useQuery({
    queryKey: ["dashboard-updates"],
    queryFn: () => updatesFn(),
    staleTime: 30_000,
  });
  const admissionsQ = useQuery({
    queryKey: ["dashboard-admissions"],
    queryFn: () => admissionsFn(),
    enabled: canSeeAdmissions,
    staleTime: 30_000,
  });

  const refreshAll = () => {
    metricsQ.refetch();
    updatesQ.refetch();
    if (canSeeAdmissions) admissionsQ.refetch();
  };

  const metricValue = (m: MetricDef): { value: string; muted: boolean } => {
    if (m.disabled) return { value: "Not enabled", muted: true };
    if (m.adminOnly && !canSeeAdmissions) return { value: "—", muted: true };
    if (metricsQ.isLoading) return { value: "…", muted: true };
    if (metricsQ.isError) return { value: "—", muted: true };
    const data = metricsQ.data;
    if (!data) return { value: "—", muted: true };
    const raw = data[m.key as keyof DashboardMetrics];
    if (raw === null || raw === undefined) return { value: "—", muted: true };
    return { value: String(raw), muted: false };
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome{currentUser?.email ? `, ${currentUser.email}` : ""}. Live metrics from your CMS
            modules.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={metricsQ.isFetching || updatesQ.isFetching || admissionsQ.isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${
              metricsQ.isFetching || updatesQ.isFetching || admissionsQ.isFetching
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </Button>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto rounded-md border bg-background p-3">
          {QUICK_ACTIONS.map((a) =>
            a.disabled ? (
              <Button
                key={a.label}
                variant="outline"
                disabled
                className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap px-4"
                title="Not enabled yet"
              >
                <a.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs">
                  {a.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">(not enabled)</span>
                </span>
              </Button>
            ) : (
              <Button
                key={a.label}
                asChild
                variant="outline"
                className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap px-4"
              >
                <Link to={a.to as string}>
                  <a.icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs">{a.label}</span>
                </Link>
              </Button>
            ),
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium uppercase tracking-wide text-muted-foreground">
          Overview
        </h2>
        {canSeeTraffic ? (
          <div className="mb-4">
            <TrafficSummaryCard />
          </div>
        ) : null}
        {metricsQ.isError ? (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load metrics.</span>
            <Button size="sm" variant="ghost" onClick={() => metricsQ.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {METRICS.map((m) => {
            const { value, muted } = metricValue(m);
            const CardInner = (
              <Card className="transition hover:border-primary/40 hover:shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {m.label}
                  </CardTitle>
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-semibold ${
                      muted ? "text-muted-foreground/60" : "text-foreground"
                    }`}
                  >
                    {value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.disabled ? "Events module not enabled" : "Open module"}
                  </p>
                </CardContent>
              </Card>
            );
            if (m.disabled) return <div key={m.key}>{CardInner}</div>;
            return (
              <Link key={m.key} to={m.to as string} className="block">
                {CardInner}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="transition hover:border-primary/40 hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent content updates</CardTitle>
            {updatesQ.isError ? (
              <Button size="sm" variant="ghost" onClick={() => updatesQ.refetch()}>
                Retry
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {updatesQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : updatesQ.isError ? (
              <p className="text-sm text-destructive">Failed to load recent activity.</p>
            ) : (updatesQ.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No CMS activity recorded yet. Actions taken across modules will appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {updatesQ.data!.map((u) => (
                  <li key={u.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {u.summary || humanizeAction(u.action)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {u.contentType ? `${u.contentType} · ` : ""}
                          {u.actorEmail ?? "System"} · {formatDateTime(u.createdAt)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="transition hover:border-primary/40 hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent admission applications</CardTitle>
            {canSeeAdmissions ? (
              <Button asChild size="sm" variant="ghost">
                <Link to="/admin/admissions">View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {!canSeeAdmissions ? (
              <p className="text-sm text-muted-foreground">
                Admissions data is not available for your account.
              </p>
            ) : admissionsQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : admissionsQ.isError ? (
              <div className="text-sm text-destructive">
                Failed to load admissions.
                <Button size="sm" variant="ghost" onClick={() => admissionsQ.refetch()}>
                  Retry
                </Button>
              </div>
            ) : (admissionsQ.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications yet. Submissions from the public admission form will appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {admissionsQ.data!.map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/admin/admissions"
                      className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{r.fullName}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.courseName} · {r.preferredBranch} ·{" "}
                          {new Date(r.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className={STATUS_STYLES[r.status]}>
                        {r.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
