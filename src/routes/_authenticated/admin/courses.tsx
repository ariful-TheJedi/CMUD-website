import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CourseForm,
  courseInputFromRow,
  emptyCourseForm,
} from "@/components/admin/CourseForm";
import {
  type AdminCourseRow,
  type CourseInput,
  type CourseStatus,
  deleteCourseAdmin,
  listAllCoursesAdmin,
  setCourseStatusAdmin,
  upsertCourseAdmin,
} from "@/lib/courses.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  head: () => ({
    meta: [{ title: "Courses — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: CoursesAdminPage,
});

function statusBadge(status: CourseStatus) {
  const variant =
    status === "published" ? "default" : status === "archived" ? "outline" : "secondary";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

function money(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString() : "0";
}

function CoursesAdminPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllCoursesAdmin);
  const deleteFn = useServerFn(deleteCourseAdmin);
  const setStatusFn = useServerFn(setCourseStatusAdmin);
  const upsertFn = useServerFn(upsertCourseAdmin);
  const { data: currentUser } = useCurrentUser();
  const canWrite = useCanWrite("courses");
  const canDelete = hasPermission(currentUser, "courses.delete");
  const canPublish = hasPermission(currentUser, "courses.publish");

  const query = useQuery({ queryKey: ["admin-courses"], queryFn: () => listFn() });

  const [toDelete, setToDelete] = useState<AdminCourseRow | null>(null);
  const [editor, setEditor] = useState<"new" | AdminCourseRow | null>(null);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
    qc.invalidateQueries({ queryKey: ["public-courses"] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Course deleted");
      invalidateAll();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: CourseStatus }) => setStatusFn({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(`Course ${v.status}`);
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message || "Status update failed"),
  });

  const upsert = useMutation({
    mutationFn: (input: CourseInput) => upsertFn({ data: input }),
    onSuccess: (_row, input) => {
      toast.success(input.id ? "Course saved" : "Course created");
      invalidateAll();
      setEditor(null);
    },
    onError: (e: Error) => {
      console.error("Course save failed:", e);
      toast.error(e.message || "Could not save course");
    },
  });

  const rows = query.data ?? [];
  const editorOpen = editor !== null;
  const editorInitial =
    editor && editor !== "new" ? courseInputFromRow(editor) : emptyCourseForm();
  const editorKey = editor === "new" ? "new" : editor?.id ?? "closed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage the courses shown on the public website.
          </p>
        </div>
        {canWrite && (
          <Button type="button" onClick={() => setEditor("new")}>
            <Plus className="h-4 w-4" /> New course
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${rows.length} courses`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {query.isError ? (
            <p className="px-4 py-8 text-sm text-destructive">
              {(query.error as Error).message || "Failed to load courses"}
            </p>
          ) : (
            <div className="max-h-[calc(100vh-14rem)] overflow-x-auto overflow-y-auto">
              <table className="w-full caption-bottom text-sm">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">/{c.slug}</TableCell>
                      <TableCell className="text-sm">{c.category}</TableCell>
                      <TableCell className="text-sm">{c.duration}</TableCell>
                      <TableCell className="text-sm">{c.mode}</TableCell>
                      <TableCell className="text-right text-sm">{money(c.fee)}</TableCell>
                      <TableCell className="text-right text-sm">{money(c.discountFee)}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>
                        {c.featured ? <Badge variant="outline">Featured</Badge> : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild aria-label="View on site">
                            <a href={`/courses/${c.slug}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          {canWrite && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditor(c)}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canPublish && c.status !== "archived" && canWrite && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={c.status === "published" ? "Unpublish" : "Publish"}
                              onClick={() =>
                                setStatus.mutate({
                                  id: c.id,
                                  status: c.status === "published" ? "draft" : "published",
                                })
                              }
                              disabled={setStatus.isPending}
                            >
                              {c.status === "published" ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {canPublish && canWrite && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={c.status === "archived" ? "Restore" : "Archive"}
                              onClick={() =>
                                setStatus.mutate({
                                  id: c.id,
                                  status: c.status === "archived" ? "draft" : "archived",
                                })
                              }
                              disabled={setStatus.isPending}
                            >
                              {c.status === "archived" ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {canDelete && canWrite && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setToDelete(c)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!query.isLoading && rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No courses yet. Click &quot;New course&quot; to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open && !upsert.isPending) setEditor(null);
        }}
      >
        <DialogContent
          className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0"
          onPointerDownOutside={(e) => {
            // Select / popover portals render outside the dialog; don't close on those clicks.
            const el = e.target as HTMLElement | null;
            if (el?.closest?.("[data-radix-select-content],[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            const el = e.target as HTMLElement | null;
            if (el?.closest?.("[data-radix-select-content],[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{editor === "new" ? "New course" : "Edit course"}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {editorOpen ? (
              <CourseForm
                key={editorKey}
                isNew={editor === "new"}
                canPublish={canPublish}
                initial={editorInitial}
                submitting={upsert.isPending}
                onCancel={() => setEditor(null)}
                onSubmit={(input) => {
                  const id = editor && editor !== "new" ? editor.id : input.id;
                  upsert.mutate({ ...input, ...(id ? { id } : {}) });
                }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.name}&quot; will be removed from the website. Consider archiving
              instead if you might restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && remove.mutate(toDelete.id)}
              disabled={remove.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
