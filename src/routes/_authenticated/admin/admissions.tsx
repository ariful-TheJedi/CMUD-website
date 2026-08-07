import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/lib/admin-access.functions";
import { canViewSection } from "@/lib/content-access.shared";
import { useCanWrite } from "@/hooks/use-can-write";

import {
  listAdmissionApplications,
  getAdmissionApplication,
  updateAdmissionStatus,
  updateAdmissionApplication,
  deleteAdmissionApplication,
  listAdmissionNotes,
  addAdmissionNote,
  type AdmissionStatus,
  type AdmissionApplicationListItem,
  type AdmissionApplicationDetail,
  type AdmissionNote,
} from "@/lib/admissions.functions";
import { listPublicCourses } from "@/lib/courses.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/admissions")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admissions — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const info = await getCurrentUser({});
    if (!canViewSection(info, "admissions")) {
      throw redirect({ to: "/admin/dashboard" });
    }
  },

  component: AdmissionsPage,
});

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  new: "New",
  contacted: "Contacted",
  admitted: "Admitted",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: AdmissionStatus }) {
  const cls: Record<AdmissionStatus, string> = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    contacted: "bg-amber-100 text-amber-900 border-amber-200",
    admitted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge variant="outline" className={cls[status]}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function formatSubmittedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso || "—";
  }
}

function AdmissionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdmissionStatus | "all">("all");
  const [courseSlug, setCourseSlug] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdmissionApplicationListItem | null>(null);
  const canWrite = useCanWrite("admissions");

  const listFn = useServerFn(listAdmissionApplications);
  const coursesFn = useServerFn(listPublicCourses);
  const deleteFn = useServerFn(deleteAdmissionApplication);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Application deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["admission-dashboard"] });
    },
    onError: () => toast.error("Could not delete application"),
  });

  const filters = useMemo(
    () => ({
      search,
      status,
      courseSlug,
      branch,
      fromDate: fromDate || null,
      toDate: toDate || null,
      page,
      pageSize,
    }),
    [search, status, courseSlug, branch, fromDate, toDate, page],
  );

  const listQ = useQuery({
    queryKey: ["admissions", filters],
    queryFn: () => listFn({ data: filters }),
  });
  const coursesQ = useQuery({
    queryKey: ["public-courses-admin"],
    queryFn: () => coursesFn(),
    staleTime: 60_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admissions"] });

  const totalPages = listQ.data ? Math.max(1, Math.ceil(listQ.data.total / pageSize)) : 1;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admissions</h1>
          <p className="text-sm text-muted-foreground">
            Manage admission applications submitted from the public form.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={listQ.isFetching}>
          <RefreshCw className={`h-4 w-4 ${listQ.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone, BMDC"
                  className="pl-8"
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setPage(1);
                setStatus(v as AdmissionStatus | "all");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={courseSlug}
              onValueChange={(v) => {
                setPage(1);
                setCourseSlug(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {(coursesQ.data ?? []).map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={branch}
              onValueChange={(v) => {
                setPage(1);
                setBranch(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                <SelectItem value="Panthapath">Panthapath</SelectItem>
                <SelectItem value="Uttara">Uttara</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 md:col-span-6">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setPage(1);
                  setFromDate(e.target.value);
                }}
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setPage(1);
                  setToDate(e.target.value);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQ.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : listQ.isError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center">
                      <div className="text-sm text-destructive">Failed to load applications.</div>
                      <Button size="sm" variant="outline" className="mt-3" onClick={refresh}>
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (listQ.data?.items.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      {search ||
                      status !== "all" ||
                      courseSlug !== "all" ||
                      branch !== "all" ||
                      fromDate ||
                      toDate
                        ? "No applications match the selected filters."
                        : "No admission applications found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  listQ.data!.items.map((r: AdmissionApplicationListItem) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.fullName}</TableCell>
                      <TableCell>
                        <a href={`tel:${r.phone}`} className="hover:underline">
                          {r.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${r.email}`} className="hover:underline">
                          {r.email}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={r.courseName}>
                        {r.courseName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.preferredBranch || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatSubmittedAt(r.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setOpenId(r.id)}>
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          {canWrite ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditId(r.id)}>
                                <Pencil className="h-4 w-4" /> Update
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(r)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>{listQ.data ? `${listQ.data.total} total` : ""}</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {openId ? <AdmissionDetailsDialog id={openId} onClose={() => setOpenId(null)} /> : null}
      {editId ? <AdmissionEditDialog id={editId} onClose={() => setEditId(null)} /> : null}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `The application from ${deleteTarget.fullName} and all its internal notes will be permanently deleted. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMut.mutate(deleteTarget.id);
              }}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdmissionDetailsDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const canWrite = useCanWrite("admissions");

  const getFn = useServerFn(getAdmissionApplication);
  const notesFn = useServerFn(listAdmissionNotes);
  const updateFn = useServerFn(updateAdmissionStatus);
  const addNoteFn = useServerFn(addAdmissionNote);

  const detailQ = useQuery({
    queryKey: ["admission", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const notesQ = useQuery({
    queryKey: ["admission-notes", id],
    queryFn: () => notesFn({ data: { applicationId: id } }),
  });

  const [pendingStatus, setPendingStatus] = useState<AdmissionStatus | null>(null);
  const [note, setNote] = useState("");

  const statusMut = useMutation({
    mutationFn: (s: AdmissionStatus) => updateFn({ data: { id, status: s } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admission", id] });
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["admission-dashboard"] });
      setPendingStatus(null);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not update status"),
  });

  const noteMut = useMutation({
    mutationFn: () => addNoteFn({ data: { applicationId: id, note: note.trim() } }),
    onSuccess: () => {
      toast.success("Note added");
      setNote("");
      qc.invalidateQueries({ queryKey: ["admission-notes", id] });
    },
    onError: () => toast.error("Could not add note"),
  });

  const handleStatusChange = (s: AdmissionStatus) => {
    if (s === "admitted" || s === "rejected") setPendingStatus(s);
    else statusMut.mutate(s);
  };

  const d: AdmissionApplicationDetail | null | undefined = detailQ.data;

  return (
    <>
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admission application</DialogTitle>
            <DialogDescription>Full application details and internal notes.</DialogDescription>
          </DialogHeader>

          {detailQ.isLoading || !d ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-3 md:grid-cols-2">
                <Field label="Full name" value={d.fullName} />
                <Field label="Email">
                  <a href={`mailto:${d.email}`} className="hover:underline">
                    {d.email}
                  </a>
                </Field>
                <Field label="Phone">
                  <a href={`tel:${d.phone}`} className="hover:underline">
                    {d.phone}
                  </a>
                </Field>
                <Field label="BMDC" value={d.bmdcNumber} />
                <Field label="Qualification" value={d.qualification} />
                <Field label="Medical college" value={d.medicalCollege} />
                <Field label="Address" value={d.address} />
                <Field label="Course" value={d.courseName} />
                <Field label="Branch" value={d.preferredBranch} />
                <Field label="Preferred batch" value={d.preferredBatch} />
                <Field label="Submitted" value={new Date(d.submittedAt).toLocaleString()} />
                <Field label="Status">
                  <StatusBadge status={d.status} />
                </Field>
                {d.statusUpdatedAt ? (
                  <Field
                    label="Last status update"
                    value={new Date(d.statusUpdatedAt).toLocaleString()}
                  />
                ) : null}
                {d.reviewedAt ? (
                  <Field label="Reviewed at" value={new Date(d.reviewedAt).toLocaleString()} />
                ) : null}
              </section>

              {d.applicantMessage ? (
                <section>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Applicant message
                  </div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                    {d.applicantMessage}
                  </p>
                </section>
              ) : null}

              <section>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Change status
                </div>
                <Select
                  value={d.status}
                  onValueChange={(v) => handleStatusChange(v as AdmissionStatus)}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </section>


              <section>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Internal notes
                </div>
                {canWrite ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      placeholder="Add an internal note (visible only to administrators)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={2000}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => noteMut.mutate()}
                        disabled={noteMut.isPending || note.trim().length < 2}
                      >
                        {noteMut.isPending ? "Saving…" : "Save note"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  {notesQ.isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (notesQ.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  ) : (
                    (notesQ.data ?? []).map((n: AdmissionNote) => (
                      <div key={n.id} className="rounded-md border p-3 text-sm">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{n.createdByEmail ?? "Administrator"}</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingStatus} onOpenChange={(v) => !v && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "admitted"
                ? "Mark this applicant as admitted?"
                : "Reject this admission application?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update the application status and be recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingStatus && statusMut.mutate(pendingStatus)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AdmissionEditDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getAdmissionApplication);
  const saveFn = useServerFn(updateAdmissionApplication);

  const detailQ = useQuery({
    queryKey: ["admission", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [form, setForm] = useState<Record<string, string> | null>(null);
  const d = detailQ.data;
  const values =
    form ??
    (d
      ? {
          fullName: d.fullName,
          email: d.email,
          phone: d.phone,
          qualification: d.qualification,
          medicalCollege: d.medicalCollege,
          bmdcNumber: d.bmdcNumber,
          preferredBranch: d.preferredBranch,
          preferredBatch: d.preferredBatch,
          address: d.address,
          applicantMessage: d.applicantMessage ?? "",
        }
      : null);

  const set = (k: string, v: string) => setForm({ ...(values ?? {}), [k]: v });

  const saveMut = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          id,
          fullName: values!.fullName,
          email: values!.email,
          phone: values!.phone,
          qualification: values!.qualification,
          medicalCollege: values!.medicalCollege,
          bmdcNumber: values!.bmdcNumber,
          preferredBranch: values!.preferredBranch as "Panthapath" | "Uttara",
          preferredBatch: values!.preferredBatch,
          address: values!.address,
          applicantMessage: values!.applicantMessage,
        },
      }),
    onSuccess: () => {
      toast.success("Application updated");
      qc.invalidateQueries({ queryKey: ["admission", id] });
      qc.invalidateQueries({ queryKey: ["admissions"] });
      onClose();
    },
    onError: () => toast.error("Could not update application"),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update application</DialogTitle>
          <DialogDescription>Edit the applicant&apos;s submitted details.</DialogDescription>
        </DialogHeader>

        {!values ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <LabeledInput
              label="Full name"
              value={values.fullName}
              onChange={(v) => set("fullName", v)}
            />
            <LabeledInput label="Email" value={values.email} onChange={(v) => set("email", v)} />
            <LabeledInput label="Phone" value={values.phone} onChange={(v) => set("phone", v)} />
            <LabeledInput
              label="BMDC number"
              value={values.bmdcNumber}
              onChange={(v) => set("bmdcNumber", v)}
            />
            <LabeledInput
              label="Qualification"
              value={values.qualification}
              onChange={(v) => set("qualification", v)}
            />
            <LabeledInput
              label="Medical college"
              value={values.medicalCollege}
              onChange={(v) => set("medicalCollege", v)}
            />
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preferred branch
              </div>
              <Select
                value={values.preferredBranch}
                onValueChange={(v) => set("preferredBranch", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Panthapath">Panthapath</SelectItem>
                  <SelectItem value="Uttara">Uttara</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <LabeledInput
              label="Preferred batch"
              value={values.preferredBatch}
              onChange={(v) => set("preferredBatch", v)}
            />
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address
              </div>
              <Textarea
                rows={2}
                value={values.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Applicant message
              </div>
              <Textarea
                rows={3}
                value={values.applicantMessage}
                onChange={(e) => set("applicantMessage", e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMut.mutate()} disabled={!values || saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{children ?? value}</div>
    </div>
  );
}
