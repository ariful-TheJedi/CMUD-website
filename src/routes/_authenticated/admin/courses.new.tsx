import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/components/admin/CourseForm";
import { upsertCourseAdmin, type CourseInput } from "@/lib/courses.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/courses/new")({
  head: () => ({
    meta: [{ title: "New Course — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: NewCoursePage,
});

function NewCoursePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertCourseAdmin);
  const { data: currentUser } = useCurrentUser();
  const canPublish = hasPermission(currentUser, "courses.publish");

  const upsert = useMutation({
    mutationFn: (input: CourseInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Course created");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["public-courses"] });
      navigate({ to: "/admin/courses" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/courses">
              <ArrowLeft className="h-4 w-4" /> Back to courses
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">New course</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course details</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm
            isNew
            canPublish={canPublish}
            onSubmit={(input) => upsert.mutate(input)}
            submitting={upsert.isPending}
            onCancel={() => navigate({ to: "/admin/courses" })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

