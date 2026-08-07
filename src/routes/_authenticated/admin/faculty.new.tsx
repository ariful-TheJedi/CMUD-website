import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacultyForm } from "@/components/admin/FacultyForm";
import { upsertFacultyAdmin, type FacultyInput } from "@/lib/faculty.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/faculty/new")({
  head: () => ({
    meta: [{ title: "New Faculty — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: NewFacultyPage,
});

function NewFacultyPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertFacultyAdmin);
  const { data: currentUser } = useCurrentUser();
  const canPublish = hasPermission(currentUser, "faculty.publish");

  const upsert = useMutation({
    mutationFn: (input: FacultyInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Faculty created");
      qc.invalidateQueries({ queryKey: ["admin-faculty"] });
      qc.invalidateQueries({ queryKey: ["public-faculty"] });
      navigate({ to: "/admin/faculty" });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save faculty"),
  });
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/faculty">
            <ArrowLeft className="h-4 w-4" /> Back to faculty
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New faculty</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faculty details</CardTitle>
        </CardHeader>
        <CardContent>
          <FacultyForm
            isNew
            canPublish={canPublish}
            onSubmit={(input) => upsert.mutate(input)}
            submitting={upsert.isPending}
            onCancel={() => navigate({ to: "/admin/faculty" })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

