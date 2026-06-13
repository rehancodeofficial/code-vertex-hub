/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@/lib/api/query-hooks";
import {
  getDepartmentsFn,
  getEmployeesFn,
  createDepartmentFn,
  updateDepartmentFn,
  deleteDepartmentFn,
} from "@/lib/api/app.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Building2, Plus, Users, Loader2, MoreHorizontal, Edit, Trash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DeptFormData {
  name: string;
  code: string;
  managerId: string;
}

const defaultForm: DeptFormData = { name: "", code: "", managerId: "" };

// ─── Page ──────────────────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const caller = useAuth((s) => s.user);
  const isAdmin = caller?.role === "admin" || caller?.role === "manager";

  const { data: departments, isLoading: deptsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartmentsFn,
  });

  const { data: employees, isLoading: empsLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployeesFn,
  });

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deletingDept, setDeletingDept] = useState<any>(null);
  const [form, setForm] = useState<DeptFormData>(defaultForm);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: DeptFormData) =>
      createDepartmentFn({ data: { ...data, managerId: data.managerId || undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setIsCreateOpen(false);
      setForm(defaultForm);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create department"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DeptFormData }) =>
      updateDepartmentFn({
        data: { id, updates: { ...updates, managerId: updates.managerId || undefined } },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setIsEditOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update department"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDepartmentFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Department deleted");
      setIsDeleteOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete department"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(defaultForm);
    setIsCreateOpen(true);
  };

  const openEdit = (dept: any) => {
    setEditingDept(dept);
    setForm({ name: dept.name, code: dept.code, managerId: dept.managerId ?? "" });
    setIsEditOpen(true);
  };

  const openDelete = (dept: any) => {
    setDeletingDept(dept);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) updateMutation.mutate({ id: editingDept.id, updates: form });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (deptsLoading || empsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const deptsData: any[] = departments || [];
  const empsData: any[] = employees || [];
  const managers = empsData.filter((e) => e.role === "manager" || e.role === "admin");

  return (
    <>
      <PageHeader
        title="Departments"
        description="Organize teams, assign managers, and monitor headcount distribution."
        actions={
          isAdmin ? (
            <Button
              className="gradient-primary text-primary-foreground shadow-glow"
              onClick={openCreate}
            >
              <Plus className="size-4" /> New department
            </Button>
          ) : null
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptsData.map((d: any) => {
          const manager = d.managerId ? empsData.find((e: any) => e.id === d.managerId) : null;
          const members = empsData.filter((e: any) => e.departmentId === d.id);
          return (
            <Card
              key={d.id}
              className="p-5 glass shadow-elevated hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-11 rounded-xl gradient-primary/15 bg-primary/10 flex items-center justify-center">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">
                    {d.code}
                  </span>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(d)}>
                          <Edit className="size-3.5 mr-1.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDelete(d)}
                        >
                          <Trash className="size-3.5 mr-1.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <h3 className="font-display text-lg font-semibold">{d.name}</h3>
              <p className="text-xs text-muted-foreground">Created {formatDate(d.createdAt)}</p>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {manager ? (
                    <>
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {initials(manager.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="text-xs font-medium">{manager.fullName.split(" ")[0]}</div>
                        <div className="text-[10px] text-muted-foreground">Manager</div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No manager assigned</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-4" /> {members.length}
                </div>
              </div>

              <div className="mt-3 flex -space-x-2">
                {members.slice(0, 5).map((m: any) => (
                  <Avatar key={m.id} className="size-7 ring-2 ring-card">
                    <AvatarFallback className="text-[10px] gradient-primary text-primary-foreground">
                      {initials(m.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 5 && (
                  <div className="size-7 rounded-full bg-muted ring-2 ring-card text-[10px] flex items-center justify-center">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {deptsData.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="size-10 mb-3 opacity-30" />
            <p className="text-sm">No departments yet. Create your first one.</p>
          </div>
        )}
      </div>

      {/* ── Create Dialog ──────────────────────────────────────────────────── */}
      <DeptDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="New Department"
        description="Add a new team or division to the organization."
        form={form}
        setForm={setForm}
        managers={managers}
        isPending={createMutation.isPending}
        onSubmit={handleCreateSubmit}
        submitLabel="Create department"
      />

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <DeptDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Department"
        description={`Modify settings for ${editingDept?.name}`}
        form={form}
        setForm={setForm}
        managers={managers}
        isPending={updateMutation.isPending}
        onSubmit={handleEditSubmit}
        submitLabel="Save changes"
      />

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingDept?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department. Employees assigned to this department
              will be unassigned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingDept && deleteMutation.mutate(deletingDept.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Delete department
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Shared Dialog ─────────────────────────────────────────────────────────────

function DeptDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  setForm,
  managers,
  isPending,
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: DeptFormData;
  setForm: React.Dispatch<React.SetStateAction<DeptFormData>>;
  managers: any[];
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="dept-name">Department name</Label>
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Engineering"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-code">Department code</Label>
              <Input
                id="dept-code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. ENG"
                maxLength={10}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-manager">Manager (optional)</Label>
              <select
                id="dept-manager"
                value={form.managerId}
                onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
              >
                <option value="">No manager assigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
