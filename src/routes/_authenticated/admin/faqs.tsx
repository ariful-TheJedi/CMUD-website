import { useState } from "react";
import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type AdminFaqRow,
  type FaqInput,
  deleteFaqAdmin,
  listAllFaqsAdmin,
  upsertFaqAdmin,
} from "@/lib/faqs.functions";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs — CMUD Admin" }, { name: "robots", content: "noindex" }] }),
  component: FaqsAdminPage,
});

function emptyForm(): FaqInput {
  return { question: "", answer: "", isPublished: true, sortOrder: 0 };
}

function FaqsAdminPage() {
  const canWrite = useCanWrite("faqs");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllFaqsAdmin);
  const upsertFn = useServerFn(upsertFaqAdmin);
  const deleteFn = useServerFn(deleteFaqAdmin);

  const query = useQuery({ queryKey: ["admin-faqs"], queryFn: () => listFn() });

  const [editing, setEditing] = useState<AdminFaqRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminFaqRow | null>(null);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-faqs"] });
    qc.invalidateQueries({ queryKey: ["public-faqs"] });
  };

  const upsert = useMutation({
    mutationFn: (input: FaqInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("FAQ saved");
      invalidateAll();
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("FAQ deleted");
      invalidateAll();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
          <p className="text-sm text-muted-foreground">
            Manage frequently asked questions shown on the /faq page.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Loading…" : `${rows.length} FAQs`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-14rem)] overflow-x-auto overflow-y-auto">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead className="w-[110px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium max-w-sm">
                      <span className="line-clamp-2">{f.question}</span>
                    </TableCell>
                    <TableCell className="max-w-md text-sm text-muted-foreground">
                      <span className="line-clamp-2">{f.answer}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          upsert.mutate({
                            id: f.id,
                            question: f.question,
                            answer: f.answer,
                            sortOrder: f.sortOrder,
                            isPublished: !f.isPublished,
                          })
                        }
                        disabled={upsert.isPending}
                        aria-label={f.isPublished ? "Unpublish FAQ" : "Publish FAQ"}
                        aria-pressed={f.isPublished}
                        className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                        style={
                          f.isPublished
                            ? {
                                background: "hsl(var(--primary))",
                                color: "hsl(var(--primary-foreground))",
                              }
                            : {
                                background: "hsl(var(--destructive))",
                                color: "hsl(var(--destructive-foreground))",
                              }
                        }
                      >
                        {f.isPublished ? "Published" : "Unpublished"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right text-sm">{f.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(f)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(f)}
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
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No FAQs yet. Click "New FAQ" to add one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </table>
          </div>
        </CardContent>
      </Card>

      <FaqFormDialog
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
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.question}" will be removed from the website. This action cannot be undone.
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

function FaqFormDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: AdminFaqRow;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: FaqInput) => void;
  submitting: boolean;
}) {
  const key = initial?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit FAQ" : "New FAQ"}</DialogTitle>
        </DialogHeader>
        <FaqForm
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

function FaqForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: AdminFaqRow;
  onSubmit: (input: FaqInput) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FaqInput>(() => (initial ? { ...initial } : emptyForm()));

  const set = <K extends keyof FaqInput>(k: K, v: FaqInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) {
      toast.error("Question is required");
      return;
    }
    if (!form.answer.trim()) {
      toast.error("Answer is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Question">
        <Input value={form.question} onChange={(e) => set("question", e.target.value)} required />
      </Field>

      <Field label="Answer">
        <Textarea value={form.answer} onChange={(e) => set("answer", e.target.value)} rows={5} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
          />
        </Field>
        <label className="flex items-end gap-2 text-sm pb-2">
          <Switch checked={form.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
          Published (visible on site)
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save FAQ"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
