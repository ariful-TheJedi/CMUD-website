import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacultyForm, facultyInputFromRow } from "@/components/admin/FacultyForm";
import { getFacultyAdmin, upsertFacultyAdmin, type FacultyInput } from "@/lib/faculty.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/faculty/$id/edit")({
  head: () => ({
    meta: [{ title: "Edit Faculty — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: EditFacultyPage,
});

function EditFacultyPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getFacultyAdmin);
  const upsertFn = useServerFn(upsertFacultyAdmin);
  const canWrite = useCanWrite("faculty");
  const { data: currentUser } = useCurrentUser();
  const canPublish = hasPermission(currentUser, "faculty.publish");

  const q = useQuery({
    queryKey: ["admin-faculty-item", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const upsert = useMutation({
    mutationFn: (input: FacultyInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Faculty saved");
      qc.invalidateQueries({ queryKey: ["admin-faculty"] });
      qc.invalidateQueries({ queryKey: ["admin-faculty-item", id] });
      qc.invalidateQueries({ queryKey: ["public-faculty"] });
      navigate({ to: "/admin/faculty" });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save faculty"),
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!q.data) throw notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/faculty">
            <ArrowLeft className="h-4 w-4" /> Back to faculty
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {canWrite ? "Edit faculty" : "Faculty details"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{q.data.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <FacultyForm
            isNew={false}
            canPublish={canPublish}
            readOnly={!canWrite}
            initial={facultyInputFromRow(q.data)}
            onSubmit={(input) => {
              if (!canWrite) return;
              upsert.mutate({ ...input, id });
            }}
            submitting={upsert.isPending}
            onCancel={() => navigate({ to: "/admin/faculty" })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
