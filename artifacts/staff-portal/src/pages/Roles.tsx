import React, { useState } from "react";
import { Shield, Plus, Trash2 } from "lucide-react";
import { useListRoles, getListRolesQueryKey, useCreateRole, useDeleteRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Roles() {
  const { data: roles, isLoading, refetch } = useListRoles({ query: { queryKey: getListRolesQueryKey() } });
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = useCreateRole({
    mutation: {
      onSuccess: () => {
        toast({ title: "Role created successfully." });
        refetch();
        setDialogOpen(false);
        setRoleName("");
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteRole({
    mutation: {
      onSuccess: () => {
        toast({ title: "Role deleted." });
        refetch();
        setDeleteId(null);
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  const saveRole = () => {
    if (!roleName.trim()) return;
    createMutation.mutate({ data: { name: roleName } });
  };

  return (
    <div className="space-y-6" data-testid="page-roles">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Roles</h1>
          <p className="text-muted-foreground mt-1">Manage system privileges and security levels.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Define Role
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Security Roles Registry
          </CardTitle>
          <CardDescription>List of available roles that can be assigned to personnel.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-t">
                <tr>
                  <th className="px-6 py-4 font-medium">Role Identity</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">Loading roles...</td></tr>
                ) : !roles?.length ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">No roles configured.</td></tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-foreground">{role.name}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteId(role.id)} 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>Define New Role</DialogTitle>
            <DialogDescription>
              Create a new security role grouping to assign to staff.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">Role Designation</label>
            <Input 
              placeholder="e.g. Super Admin, فەرمانبەر" 
              value={roleName} 
              onChange={e => setRoleName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === "Enter" && saveRole()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRole} disabled={createMutation.isPending || !roleName.trim()}>
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Security Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove the role completely and detach it from any currently assigned personnel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
