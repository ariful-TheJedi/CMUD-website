import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm, courseInputFromRow } from "@/components/admin/CourseForm";
import { getCourseAdmin, upsertCourseAdmin, type CourseInput } from "@/lib/courses.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/courses/$id/edit")({
  head: () => ({
    meta: [{ title: "Edit Course — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: EditCoursePage,
});

function EditCoursePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getCourseAdmin);
  const upsertFn = useServerFn(upsertCourseAdmin);
  const { data: currentUser } = useCurrentUser();
  const canPublish = hasPermission(currentUser, "courses.publish");

  const q = useQuery({
    queryKey: ["admin-course", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const upsert = useMutation({
    mutationFn: (input: CourseInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Course saved");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
      qc.invalidateQueries({ queryKey: ["public-courses"] });
      navigate({ to: "/admin/courses" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!q.data) throw notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/courses">
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit course</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{q.data.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm
            isNew={false}
            canPublish={canPublish}
            initial={courseInputFromRow(q.data)}
            onSubmit={(input) => upsert.mutate({ ...input, id })}
            submitting={upsert.isPending}
            onCancel={() => navigate({ to: "/admin/courses" })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

