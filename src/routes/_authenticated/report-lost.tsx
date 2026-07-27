import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
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

export const Route = createFileRoute("/_authenticated/report-lost")({
  head: () => ({
    meta: [
      { title: "Report Lost Item — Foundly" },
      { name: "description", content: "Report an item you've lost on campus." },
    ],
  }),
  component: ReportLost,
});

const schema = z.object({
  title: z.string().trim().min(2, "Required").max(100),
  category: z.string().min(1, "Choose a category"),
  description: z.string().trim().max(1000).optional(),
  location_lost: z.string().trim().max(120).optional(),
  date_lost: z.string().optional(),
});

function ReportLost() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: "" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Report a lost item</h1>
      <p className="mt-1 text-muted-foreground">Describe what you lost so someone who finds it can spot the match.</p>

      <form onSubmit={handleSubmit(async (v) => {
        if (!user) return;
        setSaving(true);
        try {
          let image_url: string | null = null;
          if (file) image_url = await uploadItemImage(file, user.id);
          const { data, error } = await supabase.from("lost_items").insert({
            owner_id: user.id,
            title: v.title,
            category: v.category,
            description: v.description ?? null,
            location_lost: v.location_lost ?? null,
            date_lost: v.date_lost || null,
            image_url,
          }).select("id").single();
          if (error) throw error;
          toast.success("Reported successfully");
          nav({ to: "/my-reports" });
          void data;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to save");
        } finally {
          setSaving(false);
        }
      })} className="mt-8 space-y-5 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div>
          <Label htmlFor="title">Item name *</Label>
          <Input id="title" placeholder="e.g. Blue Hydro flask" {...register("title")} />
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
            <Label htmlFor="date_lost">Date lost</Label>
            <Input id="date_lost" type="date" {...register("date_lost")} />
          </div>
        </div>
        <div>
          <Label htmlFor="location_lost">Last seen location</Label>
          <Input id="location_lost" placeholder="e.g. Library, 2nd floor" {...register("location_lost")} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} placeholder="Distinguishing details, but avoid revealing anything only the owner should know." {...register("description")} />
        </div>
        <div>
          <Label htmlFor="image">Photo</Label>
          <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => nav({ to: "/dashboard" })}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Submit report"}</Button>
        </div>
      </form>
    </div>
  );
}
