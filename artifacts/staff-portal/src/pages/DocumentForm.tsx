import React from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Save, FileText, User, Hash, Calendar } from "lucide-react";
import { useGetDocument, getGetDocumentQueryKey, useCreateDocument, useUpdateDocument, useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

const statusOptions = ["نوێ", "لە پێداچوونەوەدایە", "پەسەندکراوە", "ڕەتکراوەتەوە", "کۆتاییهاتووە"];

const documentSchema = z.object({
  document_number: z.string().min(1, "ژمارەی بەڵگەنامە پێویستە").max(100),
  document_date: z.string().min(1, "بەرواری بەڵگەنامە پێویستە"),
  subject: z.string().min(1, "بابەت پێویستە").max(255),
  creator_id: z.coerce.number({ required_error: "دروستکەر پێویستە" }),
  current_status: z.string().min(1),
  file_path: z.string().min(1, "ڕێچکەی فایل پێویستە").max(500),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export default function DocumentForm() {
  const [matchNew] = useRoute("/documents/new");
  const [, editParams] = useRoute("/documents/:id/edit");
  const isNew = !!matchNew;
  const documentId = !isNew && editParams?.id ? Number(editParams.id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: document, isLoading: loadingDoc } = useGetDocument(documentId as number, {
    query: { enabled: !!documentId, queryKey: getGetDocumentQueryKey(documentId as number) }
  });

  const { data: users } = useListUsers({}, { query: { queryKey: getListUsersQueryKey({}) } });

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: "بەڵگەنامەکە بە سەرکەوتوویی زیادکرا." });
        setLocation("/documents");
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە دروستکردن", description: err.message, variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: "بەڵگەنامەکە بە سەرکەوتوویی نوێکرایەوە." });
        setLocation(`/documents/${documentId}`);
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە نوێکردنەوە", description: err.message, variant: "destructive" });
      }
    }
  });

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      document_number: "",
      document_date: new Date().toISOString().slice(0, 10),
      subject: "",
      creator_id: user?.id,
      current_status: "نوێ",
      file_path: "",
    },
    values: document ? {
      document_number: document.document_number,
      document_date: document.document_date.slice(0, 10),
      subject: document.subject,
      creator_id: document.creator_id,
      current_status: document.current_status,
      file_path: document.file_path,
    } : undefined,
  });

  const onSubmit = (values: DocumentFormValues) => {
    if (isNew) {
      createMutation.mutate({ data: { ...values, document_date: new Date(values.document_date) as any } });
    } else {
      updateMutation.mutate({ id: documentId as number, data: { ...values, document_date: new Date(values.document_date) as any } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && loadingDoc) {
    return <div className="p-8 text-center text-muted-foreground" style={ku}>چاوەڕێ بکە...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6" data-testid="page-document-form" style={ku}>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/documents"><ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "زیادکردنی بەڵگەنامەی نوێ" : "دەستکاریکردنی بەڵگەنامە"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNew ? "بەڵگەنامەیەکی نوێ تۆمار بکە." : "زانیاری بەڵگەنامەکە بگۆڕە."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                زانیاری بەڵگەنامە
              </CardTitle>
              <CardDescription>وردەکاری سەرەکی بەڵگەنامەکە.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <FormField control={form.control} name="document_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>ژمارەی بەڵگەنامە</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بۆ نموونە: DOC-2026-001" className="pr-9 text-right" style={ku} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="document_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>بەرواری بەڵگەنامە</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="date" className="pr-9 text-right" style={ku} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>بابەت</FormLabel>
                  <FormControl>
                    <Input placeholder="بابەتی بەڵگەنامەکە بنووسە" className="text-right" style={ku} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="creator_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>دروستکەر</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : undefined}>
                    <FormControl>
                      <SelectTrigger style={ku}>
                        <User className="h-4 w-4 ml-2 text-muted-foreground" />
                        <SelectValue placeholder="فەرمانبەرێک هەڵبژێرە" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={ku}>
                      {users?.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="current_status" render={({ field }) => (
                <FormItem>
                  <FormLabel>دۆخ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger style={ku}>
                        <SelectValue placeholder="دۆخ هەڵبژێرە" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={ku}>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="file_path" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>ڕێچکەی فایل</FormLabel>
                  <FormControl>
                    <Input placeholder="بۆ نموونە: /uploads/documents/doc-2026-001.pdf" className="text-right" style={ku} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-start gap-4 pb-12">
            <Button type="submit" disabled={isPending} className="min-w-[120px]" style={ku}>
              {isPending ? "چاوەڕێ بکە..." : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  پاشەکەوتکردن
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild style={ku}>
              <Link href="/documents">پاشگەزبوونەوە</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
