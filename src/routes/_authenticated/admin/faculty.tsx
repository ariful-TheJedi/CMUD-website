import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
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
  FacultyForm,
  emptyFacultyForm,
  facultyInputFromRow,
} from "@/components/admin/FacultyForm";
import {
  type AdminFacultyRow,
  type FacultyInput,
  type FacultyStatus,
  deleteFacultyAdmin,
  listAllFacultyAdmin,
  setFacultyStatusAdmin,
  upsertFacultyAdmin,
} from "@/lib/faculty.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/faculty")({
  head: () => ({
    meta: [{ title: "Faculty — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: FacultyAdminPage,
});

function statusBadge(status: FacultyStatus) {
  const variant =
    status === "published" ? "default" : status === "archived" ? "outline" : "secondary";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

function FacultyAdminPage() {
  const canWrite = useCanWrite("faculty");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllFacultyAdmin);
  const deleteFn = useServerFn(deleteFacultyAdmin);
  const setStatusFn = useServerFn(setFacultyStatusAdmin);
  const upsertFn = useServerFn(upsertFacultyAdmin);
  const { data: currentUser } = useCurrentUser();
  const canDelete = hasPermission(currentUser, "faculty.delete");
  const canPublish = hasPermission(currentUser, "faculty.publish");

  const query = useQuery({ queryKey: ["admin-faculty"], queryFn: () => listFn() });

  const [toDelete, setToDelete] = useState<AdminFacultyRow | null>(null);
  const [editor, setEditor] = useState<"new" | AdminFacultyRow | null>(null);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-faculty"] });
    qc.invalidateQueries({ queryKey: ["public-faculty"] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Faculty deleted");
      invalidateAll();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: FacultyStatus }) => setStatusFn({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(`Faculty ${v.status}`);
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message || "Status update failed"),
  });

  const upsert = useMutation({
    mutationFn: (input: FacultyInput) => upsertFn({ data: input }),
    onSuccess: (_row, input) => {
      toast.success(input.id ? "Faculty saved" : "Faculty created");
      invalidateAll();
      setEditor(null);
    },
    onError: (e: Error) => {
      console.error("Faculty save failed:", e);
      toast.error(e.message || "Could not save faculty");
    },
  });

  const rows = query.data ?? [];
  const editorOpen = editor !== null;
  const editorInitial =
    editor && editor !== "new" ? facultyInputFromRow(editor) : emptyFacultyForm();
  const editorKey = editor === "new" ? "new" : editor?.id ?? "closed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Faculty</h1>
          <p className="text-sm text-muted-foreground">
            Manage the faculty members shown on the public website.
          </p>
        </div>
        {canWrite && (
          <Button type="button" onClick={() => setEditor("new")}>
            <Plus className="h-4 w-4" /> New faculty
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${rows.length} faculty members`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {query.isError ? (
            <p className="px-4 py-8 text-sm text-destructive">
              {(query.error as Error).message || "Failed to load faculty"}
            </p>
          ) : (
            <div className="max-h-[calc(100vh-14rem)] overflow-x-auto overflow-y-auto">
              <table className="w-full caption-bottom text-sm">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Credentials</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead className="w-[200px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        {f.photoUrl ? (
                          <img
                            src={f.photoUrl}
                            alt={f.altText || f.name}
                            className="h-12 w-9 rounded object-cover object-top"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-9 items-center justify-center rounded bg-muted text-xs font-medium">
                            {f.initials || "—"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.title}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {f.credentials}
                      </TableCell>
                      <TableCell className="text-sm">{f.specialty}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {f.phone || "—"}
                      </TableCell>
                      <TableCell>{statusBadge(f.status)}</TableCell>
                      <TableCell className="text-right text-sm">{f.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditor(f)}
                            aria-label={canWrite ? "Edit" : "View details"}
                            title={canWrite ? "Edit" : "View details"}
                          >
                            {canWrite ? (
                              <Pencil className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          {canPublish && f.status !== "archived" && canWrite && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={f.status === "published" ? "Unpublish" : "Publish"}
                              aria-label={f.status === "published" ? "Unpublish" : "Publish"}
                              onClick={() =>
                                setStatus.mutate({
                                  id: f.id,
                                  status: f.status === "published" ? "draft" : "published",
                                })
                              }
                              disabled={setStatus.isPending}
                            >
                              {f.status === "published" ? (
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
                              title={f.status === "archived" ? "Restore" : "Archive"}
                              aria-label={f.status === "archived" ? "Restore" : "Archive"}
                              onClick={() =>
                                setStatus.mutate({
                                  id: f.id,
                                  status: f.status === "archived" ? "draft" : "archived",
                                })
                              }
                              disabled={setStatus.isPending}
                            >
                              {f.status === "archived" ? (
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
                              onClick={() => setToDelete(f)}
                              aria-label="Delete"
                              title="Delete"
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
                        colSpan={9}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No faculty yet.
                        {canWrite ? ' Click "New faculty" to add one.' : ""}
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
            <DialogTitle>
              {editor === "new"
                ? "New faculty"
                : canWrite
                  ? "Edit faculty"
                  : "Faculty details"}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {editorOpen ? (
              <FacultyForm
                key={editorKey}
                isNew={editor === "new"}
                canPublish={canPublish}
                readOnly={!canWrite && editor !== "new"}
                initial={editorInitial}
                submitting={upsert.isPending}
                onCancel={() => setEditor(null)}
                onSubmit={(input) => {
                  if (!canWrite) return;
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
            <AlertDialogTitle>Delete this faculty member?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.name}&quot; will be removed from the website. Consider archiving
              instead if you might restore later. This action cannot be undone.
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
