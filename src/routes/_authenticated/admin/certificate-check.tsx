import { useRef, useState } from "react";
import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type CertificateRow,
  type CertificateInput,
  bulkInsertCertificatesAdmin,
  deleteCertificateAdmin,
  listAllCertificatesAdmin,
  upsertCertificateAdmin,
} from "@/lib/certificates.functions";
import { listPublicCourses } from "@/lib/courses.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/certificate-check")({
  head: () => ({
    meta: [{ title: "Certificates — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: CertificatesAdminPage,
});

function emptyForm(): CertificateInput {
  return {
    studentName: "",
    courseName: "",
    batch: "",
    yearOfAdmission: null,
    certificateNumber: "",
    bmdcNumber: "",
    mobileNumber: "",
  };
}

const COLUMN_ALIASES: Record<keyof CertificateInput, string[]> = {
  studentName: ["student name", "name", "student"],
  courseName: ["course name", "course"],
  batch: ["batch"],
  yearOfAdmission: [
    "month/year of admission",
    "month year of admission",
    "year of admission",
    "admission year",
    "year",
  ],
  certificateNumber: ["certificate number", "certificate no", "cert no", "certificate"],
  bmdcNumber: ["bmdc number", "bmdc no", "bmdc"],
  mobileNumber: ["mobile number", "mobile", "phone", "contact"],
  id: [],
};

const MONTH_YEAR_RE = /^(0[1-9]|1[0-2])\/(19|20)\d{2}$/;

function normalizeKey(k: string) {
  return k.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function parseSheetRows(sheet: Record<string, unknown>[]): CertificateInput[] {
  return sheet.map((raw) => {
    const norm: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) norm[normalizeKey(k)] = raw[k];
    const pick = (field: keyof CertificateInput) => {
      for (const alias of COLUMN_ALIASES[field]) {
        if (alias in norm && norm[alias] != null && String(norm[alias]).trim() !== "") {
          return String(norm[alias]).trim();
        }
      }
      return "";
    };
    const yearStr = pick("yearOfAdmission");
    return {
      studentName: pick("studentName"),
      courseName: pick("courseName"),
      batch: pick("batch"),
      yearOfAdmission: yearStr || null,
      certificateNumber: pick("certificateNumber"),
      bmdcNumber: pick("bmdcNumber"),
      mobileNumber: pick("mobileNumber"),
    };
  });
}

function CertificatesAdminPage() {
  const canWrite = useCanWrite("certificates");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllCertificatesAdmin);
  const upsertFn = useServerFn(upsertCertificateAdmin);
  const deleteFn = useServerFn(deleteCertificateAdmin);
  const bulkFn = useServerFn(bulkInsertCertificatesAdmin);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = useQuery({ queryKey: ["admin-certificates"], queryFn: () => listFn() });

  const [editing, setEditing] = useState<CertificateRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<CertificateRow | null>(null);
  const [search, setSearch] = useState("");
  const [importReport, setImportReport] = useState<{
    inserted: number;
    errors: { row: number; message: string }[];
    fileName: string;
  } | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-certificates"] });

  const upsert = useMutation({
    mutationFn: (input: CertificateInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Certificate saved");
      invalidate();
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Certificate deleted");
      invalidate();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulk = useMutation({
    mutationFn: (payload: { rows: CertificateInput[]; fileName: string }) =>
      bulkFn({ data: { rows: payload.rows } }).then((res) => ({
        ...res,
        fileName: payload.fileName,
      })),
    onSuccess: (res) => {
      setImportReport({ inserted: res.inserted, errors: res.errors, fileName: res.fileName });
      if (res.inserted > 0) toast.success(`${res.inserted} certificate(s) imported`);
      if (res.errors.length)
        toast.error(`${res.errors.length} row(s) had errors — see report below`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
        defval: "",
      });
      const rows = parseSheetRows(json);
      if (rows.length === 0) {
        toast.error("Sheet is empty");
        return;
      }
      bulk.mutate({ rows, fileName: file.name });
    } catch (e) {
      toast.error(`Failed to read file: ${(e as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Student Name": "Jane Doe",
        "Course Name": "Certificate in Medical Ultrasound",
        Batch: "CMU-24",
        "Month/Year of Admission": "01/2024",
        "Certificate Number": "CMUD-2025-0001",
        "BMDC Number": "A-12345",
        "Mobile Number": "+8801XXXXXXXXX",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificates");
    XLSX.writeFile(wb, "certificates-template.xlsx");
  };

  const rows = (query.data ?? []).filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [r.studentName, r.courseName, r.batch, r.certificateNumber, r.bmdcNumber, r.mobileNumber]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(s));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
          <p className="text-sm text-muted-foreground">
            Records shown on the /certificate-check verification page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {canWrite && (
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Template
            </Button>
          )}
          {canWrite && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={bulk.isPending}
            >
              <Upload className="h-4 w-4" /> {bulk.isPending ? "Importing…" : "Import Excel"}
            </Button>
          )}
          {canWrite && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New Certificate
            </Button>
          )}
        </div>
      </div>

      {importReport ? (
        <Card
          className={importReport.errors.length ? "border-destructive/40" : "border-emerald-500/40"}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-base">Import report — {importReport.fileName}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {importReport.inserted} inserted · {importReport.errors.length} error(s)
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportReport(null)}>
              Dismiss
            </Button>
          </CardHeader>
          {importReport.errors.length > 0 ? (
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto border-t">
                <table className="w-full text-sm">
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-24">Row</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importReport.errors.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {e.row === 0 ? "—" : e.row}
                        </TableCell>
                        <TableCell className="text-destructive">{e.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${rows.length} certificate(s)`}
          </CardTitle>
          <Input
            placeholder="Search name, course, cert no, BMDC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-16rem)] overflow-x-auto overflow-y-auto">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Certificate No</TableHead>
                  <TableHead>BMDC No</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead className="w-[110px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.studentName}</TableCell>
                    <TableCell>{c.courseName}</TableCell>
                    <TableCell>{c.batch || "—"}</TableCell>
                    <TableCell>{c.yearOfAdmission ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.certificateNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{c.bmdcNumber || "—"}</TableCell>
                    <TableCell>{c.mobileNumber || "—"}</TableCell>
                    <TableCell className="text-right">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(c)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(c)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!query.isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No certificates. Add manually or import an Excel sheet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CertFormDialog
        open={creating || editing !== null}
        initial={editing ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSubmit={(input) => upsert.mutate(input)}
        submitting={upsert.isPending}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.studentName} — {toDelete?.certificateNumber}. This action cannot be undone.
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

function CertFormDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: CertificateRow;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CertificateInput) => void;
  submitting: boolean;
}) {
  const key = initial?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit certificate" : "New certificate"}</DialogTitle>
        </DialogHeader>
        <CertForm
          key={key}
          initial={initial}
          onSubmit={onSubmit}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CertForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: CertificateRow;
  onSubmit: (input: CertificateInput) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CertificateInput>(() =>
    initial
      ? {
          ...initial,
          id: initial.id,
          bmdcNumber: initial.bmdcNumber ?? "",
          mobileNumber: initial.mobileNumber ?? "",
        }
      : emptyForm(),
  );
  const set = <K extends keyof CertificateInput>(k: K, v: CertificateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const coursesFn = useServerFn(listPublicCourses);
  const coursesQuery = useQuery({ queryKey: ["public-courses"], queryFn: () => coursesFn() });
  const courseOptions = coursesQuery.data ?? [];

  const monthYear = (form.yearOfAdmission ?? "").trim();
  const canSave = form.courseName.trim() !== "" && MONTH_YEAR_RE.test(monthYear);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim()) return toast.error("Student name is required");
    if (!form.courseName.trim()) return toast.error("Course name is required");
    if (!form.certificateNumber.trim()) return toast.error("Certificate number is required");
    if (!MONTH_YEAR_RE.test(monthYear)) {
      return toast.error("Month/Year of Admission must be in MM/YYYY format (e.g. 01/2024)");
    }
    onSubmit({ ...form, yearOfAdmission: monthYear || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student Name">
          <Input
            value={form.studentName}
            onChange={(e) => set("studentName", e.target.value)}
            required
          />
        </Field>
        <Field label="Course Name" helper="Pick a course from the list before saving.">
          <Select value={form.courseName || undefined} onValueChange={(v) => set("courseName", v)}>
            <SelectTrigger>
              <SelectValue
                placeholder={coursesQuery.isLoading ? "Loading courses…" : "— Select a course —"}
              />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((c) => (
                <SelectItem key={c.slug} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
              {form.courseName && !courseOptions.some((c) => c.name === form.courseName) ? (
                <SelectItem value={form.courseName}>{form.courseName}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Batch">
          <Input value={form.batch} onChange={(e) => set("batch", e.target.value)} />
        </Field>
        <Field label="Month/Year of Admission">
          <Input
            placeholder="MM/YYYY"
            value={form.yearOfAdmission ?? ""}
            onChange={(e) => set("yearOfAdmission", e.target.value || null)}
          />
        </Field>
        <Field label="Certificate Number">
          <Input
            value={form.certificateNumber}
            onChange={(e) => set("certificateNumber", e.target.value)}
            required
          />
        </Field>
        <Field label="BMDC Number">
          <Input
            value={form.bmdcNumber ?? ""}
            onChange={(e) => set("bmdcNumber", e.target.value)}
          />
        </Field>
        <Field label="Mobile Number">
          <Input
            value={form.mobileNumber ?? ""}
            onChange={(e) => set("mobileNumber", e.target.value)}
          />
        </Field>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !canSave}>
          {submitting ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
