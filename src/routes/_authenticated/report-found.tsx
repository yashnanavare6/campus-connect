import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadItemImage } from "@/lib/upload";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/report-found")({
  head: () => ({
    meta: [
      { title: "Report Found Item — Foundly" },
      { name: "description", content: "Report a found item and add hidden verification questions." },
    ],
  }),
  component: ReportFound,
});

const schema = z.object({
  title: z.string().trim().min(2).max(100),
  category: z.string().min(1),
  public_description: z.string().trim().max(1000).optional(),
  location_found: z.string().trim().max(120).optional(),
  date_found: z.string().optional(),
  finder_contact: z.string().trim().min(3).max(200),
  questions: z.array(z.object({
    question: z.string().trim().min(3, "Add a question").max(200),
    answer: z.string().trim().min(1, "Add the expected answer").max(200),
  })).min(1, "Add at least one verification question").max(6),
});

function ReportFound() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      questions: [{ question: "What is a unique detail about this item?", answer: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "questions" });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Report a found item</h1>
      <p className="mt-1 text-muted-foreground">Hidden details stay private. Only you (and admins) can see them.</p>

      <form onSubmit={handleSubmit(async (v) => {
        if (!user) return;
        setSaving(true);
        try {
          let image_url: string | null = null;
          if (file) image_url = await uploadItemImage(file, user.id);
          const hidden = {
            questions: v.questions.map((q) => ({
              question: q.question,
              answer: q.answer.trim().toLowerCase(),
            })),
          };
          const { error } = await supabase.from("found_items").insert({
            finder_id: user.id,
            title: v.title,
            category: v.category,
            public_description: v.public_description ?? null,
            hidden_details: hidden,
            finder_contact: v.finder_contact,
            location_found: v.location_found ?? null,
            date_found: v.date_found || null,
            image_url,
          });
          if (error) throw error;
          toast.success("Reported. Thanks for helping!");
          nav({ to: "/my-reports" });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
          setSaving(false);
        }
      })} className="mt-8 space-y-5 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">

        <div>
          <Label htmlFor="title">Item name *</Label>
          <Input id="title" placeholder="e.g. Black wallet" {...register("title")} />
          {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Category *</Label>
            <Select onValueChange={(v) => setValue("category", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <div>
            <Label htmlFor="date_found">Date found</Label>
            <Input id="date_found" type="date" {...register("date_found")} />
          </div>
        </div>
        <div>
          <Label htmlFor="location_found">Where you found it</Label>
          <Input id="location_found" placeholder="e.g. Cafeteria" {...register("location_found")} />
        </div>
        <div>
          <Label htmlFor="pub">Public description</Label>
          <Textarea id="pub" rows={3} placeholder="Say enough that someone recognises the general item — but nothing only the owner would know." {...register("public_description")} />
        </div>
        <div>
          <Label htmlFor="image">Photo</Label>
          <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="rounded-xl border bg-accent/30 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium"><Lock className="size-4" /> Hidden verification</div>
          <p className="text-xs text-muted-foreground">Only visible to you and admins. Claimers must answer these correctly.</p>
        </div>

        <div>
          <Label>Contact info (shared only after you approve a claim) *</Label>
          <Input placeholder="e.g. phone or email" {...register("finder_contact")} />
          {errors.finder_contact && <p className="mt-1 text-xs text-destructive">{errors.finder_contact.message}</p>}
        </div>

        <div className="space-y-3">
          <Label>Verification questions *</Label>
          {fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border bg-background p-3">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 gap-2">
                  <Input placeholder="Question" {...register(`questions.${i}.question` as const)} />
                  <Input placeholder="Expected answer" {...register(`questions.${i}.answer` as const)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {errors.questions && <p className="text-xs text-destructive">{"message" in (errors.questions as object) ? (errors.questions as { message?: string }).message : "Fix errors above"}</p>}
          {fields.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", answer: "" })}>
              <Plus className="mr-1 size-4" /> Add question
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => nav({ to: "/dashboard" })}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Submit"}</Button>
        </div>
      </form>
    </div>
  );
}
