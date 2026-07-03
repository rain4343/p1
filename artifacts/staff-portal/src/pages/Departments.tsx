import React, { useState } from "react";
import { Building2, Pencil, Trash2, Plus, Eye } from "lucide-react";
import { Link } from "wouter";
import { 
  useListDepartments, getListDepartmentsQueryKey, 
  useCreateDepartment, 
  useUpdateDepartment, 
  useDeleteDepartment 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Departments() {
  const { data: departments, isLoading, refetch } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<{ id: number, name: string } | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Department created." });
        refetch();
        closeDialog();
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  });

  const updateMutation = useUpdateDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Department updated." });
        refetch();
        closeDialog();
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Department deleted." });
        refetch();
        setDeleteId(null);
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  const openNew = () => {
    setEditingDept(null);
    setDeptName("");
    setDialogOpen(true);
  };

  const openEdit = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDept(null);
    setDeptName("");
  };

  const saveDept = () => {
    if (!deptName.trim()) return;
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, data: { name: deptName } });
    } else {
      createMutation.mutate({ data: { name: deptName } });
    }
  };

  return (
    <div className="space-y-6" data-testid="page-departments">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Divisions & Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational units and groupings.</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Active Departments
          </CardTitle>
          <CardDescription>A complete registry of organizational divisions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-t">
                <tr>
                  <th className="px-6 py-4 font-medium">Department Name</th>
                  <th className="px-6 py-4 font-medium">Date Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Loading departments...</td></tr>
                ) : !departments?.length ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No departments configured.</td></tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <Link href={`/departments/${dept.id}`} className="hover:underline font-semibold text-primary">
                          {dept.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(dept.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" asChild className="h-8">
                            <Link href={`/departments/${dept.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Staff
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(dept)} className="h-8">
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(dept.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "Modify the division name." : "Create a new organizational division."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">Department Name</label>
            <Input 
              placeholder="e.g. Human Resources" 
              value={deptName} 
              onChange={e => setDeptName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === "Enter" && saveDept()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={saveDept} disabled={createMutation.isPending || updateMutation.isPending || !deptName.trim()}>
              Save Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove the department. Any staff assigned to this department will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Department"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
