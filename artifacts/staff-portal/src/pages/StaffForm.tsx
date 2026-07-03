import React, { useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Shield, User, Mail, Hash, Building2 } from "lucide-react";
import { 
  useGetUser, getGetUserQueryKey,
  useCreateUser, 
  useUpdateUser, 
  useListDepartments, getListDepartmentsQueryKey,
  useListRoles, getListRolesQueryKey,
  useGetUserRoles, getGetUserRolesQueryKey,
  useAssignRole, useRemoveRole
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const userSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(150),
  username: z.string().min(1, "Username is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")),
  department_id: z.coerce.number().nullable().optional(),
  role_ids: z.array(z.number()).default([])
});

type UserFormValues = z.infer<typeof userSchema>;

export default function StaffForm() {
  const [, params] = useRoute("/staff/:id");
  const isNew = !params?.id || params.id === "new";
  const userId = !isNew ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useGetUser(userId as number, { 
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId as number) } 
  });
  
  const { data: userRoles } = useGetUserRoles(userId as number, {
    query: { enabled: !!userId, queryKey: getGetUserRolesQueryKey(userId as number) }
  });
  
  const { data: departments } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const { data: roles } = useListRoles({ query: { queryKey: getListRolesQueryKey() } });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Staff member added successfully" });
        setLocation("/staff");
      },
      onError: (err: any) => {
        toast({ title: "Error creating staff", description: err.message, variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Staff member updated successfully" });
        setLocation("/staff");
      },
      onError: (err: any) => {
        toast({ title: "Error updating staff", description: err.message, variant: "destructive" });
      }
    }
  });

  const assignRoleMutation = useAssignRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserRolesQueryKey(userId as number) });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId as number) });
      }
    }
  });

  const removeRoleMutation = useRemoveRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserRolesQueryKey(userId as number) });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId as number) });
      }
    }
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      password: "",
      department_id: null,
      role_ids: []
    }
  });

  const initializedRef = useRef(false);
  useEffect(() => {
    if (user && !initializedRef.current) {
      form.reset({
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        password: "", // Never prefill password
        department_id: user.department_id,
        role_ids: userRoles?.map(r => r.id) || []
      });
      // We only re-initialize if the user id changes
      initializedRef.current = true;
    }
  }, [user, userRoles, form]);
  
  useEffect(() => {
    return () => { initializedRef.current = false; };
  }, [userId]);

  const onSubmit = (values: UserFormValues) => {
    if (isNew) {
      if (!values.password) {
        form.setError("password", { message: "Password is required for new users" });
        return;
      }
      createMutation.mutate({ data: values as any });
    } else {
      const updateData = { ...values };
      if (!updateData.password) delete (updateData as any).password;
      // Exclude role_ids from update if we are managing them individually
      delete (updateData as any).role_ids;
      updateMutation.mutate({ id: userId as number, data: updateData });
    }
  };

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    if (isNew) {
      // Just update form state for new users (handled by the useCreateUser API)
      const currentRoles = form.getValues().role_ids;
      if (checked) {
        form.setValue("role_ids", [...currentRoles, roleId]);
      } else {
        form.setValue("role_ids", currentRoles.filter(id => id !== roleId));
      }
      return;
    }

    // For existing users, use the dedicated assign/remove role hooks
    if (checked) {
      assignRoleMutation.mutate({ id: userId as number, data: { role_id: roleId } });
    } else {
      removeRoleMutation.mutate({ id: userId as number, roleId });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && loadingUser) {
    return <div className="p-8 text-center text-muted-foreground">Loading staff record...</div>;
  }

  const currentFormRoles = form.watch("role_ids");

  return (
    <div className="max-w-3xl space-y-6" data-testid="page-staff-form">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/staff"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? "Add Staff Member" : "Edit Staff Member"}</h1>
          <p className="text-muted-foreground mt-1">
            {isNew ? "Create a new personnel record and assign access." : "Update personnel details and adjust access levels."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Personal Information
              </CardTitle>
              <CardDescription>Core identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full Legal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="jdoe" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="jane.doe@organization.org" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{isNew ? "Initial Password" : "Reset Password"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={isNew ? "Create a secure password" : "Leave blank to keep current password"} {...field} />
                    </FormControl>
                    {isNew && <FormDescription>Required for initial setup. User should change this later.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Department & Assignment
              </CardTitle>
              <CardDescription>Organizational placement.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))} 
                      value={field.value ? field.value.toString() : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {departments?.map(dept => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Access Roles
              </CardTitle>
              <CardDescription>
                {isNew 
                  ? "Select capabilities and permissions to assign upon creation." 
                  : "Changes to roles take effect immediately."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {roles?.map((role) => {
                  const isAssigned = isNew ? currentFormRoles.includes(role.id) : (userRoles?.some(r => r.id === role.id) ?? false);
                  const isRoleChanging = assignRoleMutation.isPending || removeRoleMutation.isPending;
                  
                  return (
                    <div
                      key={role.id}
                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"
                    >
                      <Checkbox
                        checked={isAssigned}
                        disabled={!isNew && isRoleChanging}
                        onCheckedChange={(checked) => handleRoleToggle(role.id, !!checked)}
                      />
                      <div className="space-y-1 leading-none">
                        <label className="font-medium text-sm leading-none cursor-pointer">
                          {role.name}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button type="button" variant="outline" asChild>
              <Link href="/staff">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[120px]">
              {isPending ? "Saving..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Record
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
