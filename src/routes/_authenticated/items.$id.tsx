import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-profile";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/upload";
import { Lock, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/items/$id")({
  head: () => ({ meta: [{ title: "Item — Foundly" }, { name: "description", content: "Item details." }] }),
  component: ItemDetail,
});

type FoundItem = {
  id: string;
  finder_id: string;
  title: string;
  category: string;
  public_description: string | null;
  hidden_details: { questions: { question: string; answer: string }[] } | null;
  finder_contact: string | null;
  location_found: string | null;
  date_found: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
};

function ItemDetail() {
  const { id } = useParams({ from: "/_authenticated/items/$id" });
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const priv = await supabase.from("found_items").select("*").eq("id", id).maybeSingle();
      if (priv.data) return priv.data as FoundItem;
      const pub = await supabase.from("found_items_public").select("*").eq("id", id).maybeSingle();
      return pub.data as FoundItem | null;
    },
  });

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  useEffect(() => { if (data?.image_url) getImageUrl(data.image_url).then(setImgUrl); }, [data?.image_url]);

  const isFinder = !!user && !!data && data.finder_id === user.id;
  const canSeeHidden = isFinder || !!isAdmin;
  const hasQuestions = data?.hidden_details?.questions ?? [];

  const [answers, setAnswers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!data) return <div className="text-muted-foreground">Item not found.</div>;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-5">
      <div className="md:col-span-3 space-y-4">
        <div className="aspect-video overflow-hidden rounded-2xl border bg-muted">
          {imgUrl ? <img src={imgUrl} alt={data.title} className="h-full w-full object-cover" /> :
            <div className="h-full w-full" style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--muted))" }} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">{data.category}</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{data.status}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">{data.location_found ?? "Unknown location"} · {data.date_found ?? ""}</div>
          {data.public_description && <p className="mt-4 text-sm">{data.public_description}</p>}
        </div>

        {canSeeHidden && (
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/40 p-5">
            <div className="mb-2 flex items-center gap-2 font-medium"><Lock className="size-4" /> Hidden verification (only you & admins)</div>
            {data.finder_contact && <div className="text-sm"><span className="text-muted-foreground">Finder contact:</span> {data.finder_contact}</div>}
            <ol className="mt-3 space-y-2 text-sm">
              {hasQuestions.map((q, i) => (
                <li key={i}><div className="font-medium">Q{i + 1}. {q.question}</div><div className="text-muted-foreground">Answer: {q.answer}</div></li>
              ))}
            </ol>
          </div>
        )}

        {canSeeHidden && <ClaimsList itemId={data.id} />}
      </div>

      <aside className="md:col-span-2">
        {!isFinder && data.status !== "recovered" ? (
          <div className="sticky top-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-semibold">Claim this item</h2>
            <p className="mt-1 text-xs text-muted-foreground">Answer the finder's verification questions. Only correct answers reveal contact details.</p>
            <div className="mt-4 space-y-3">
              {hasQuestions.map((q, i) => (
                <div key={i}>
                  <Label>{q.question}</Label>
                  <Input value={answers[i] ?? ""} onChange={(e) => {
                    const next = [...answers]; next[i] = e.target.value; setAnswers(next);
                  }} />
                </div>
              ))}
              {hasQuestions.length === 0 && <div className="text-xs text-muted-foreground">No questions available yet.</div>}
              <div>
                <Label>Additional details (optional)</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else to prove ownership" />
              </div>
              <Button className="w-full" disabled={submitting || hasQuestions.length === 0} onClick={async () => {
                if (!user) return;
                setSubmitting(true);
                try {
                  const payload = hasQuestions.map((q, i) => ({
                    question: q.question,
                    submitted: (answers[i] ?? "").trim(),
                    matched: (answers[i] ?? "").trim().toLowerCase() === q.answer.toLowerCase(),
                  }));
                  const allMatched = payload.every((p) => p.matched);
                  const { error } = await supabase.from("claims").insert({
                    item_id: data.id,
                    claimer_id: user.id,
                    verification_answers: payload as unknown as never,
                    message: note || null,
                    status: allMatched ? "approved" : "pending",
                  });
                  if (error) throw error;
                  if (allMatched) {
                    toast.success("Verified! The finder has been notified.", { icon: <CheckCircle2 className="size-4 text-success" /> });
                  } else {
                    toast("Claim submitted for manual review.", { icon: <XCircle className="size-4 text-warning" /> });
                  }
                  qc.invalidateQueries({ queryKey: ["item", id] });
                  nav({ to: "/my-reports" });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                } finally { setSubmitting(false); }
              }}>{submitting ? "Submitting…" : "Submit claim"}</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">{isFinder ? "You reported this item." : "This item has been recovered."}</div>
          </div>
        )}
      </aside>
    </div>
  );
}

type ClaimRow = {
  id: string;
  claimer_id: string;
  status: string;
  message: string | null;
  created_at: string;
  verification_answers: { question: string; submitted: string; matched: boolean }[];
  profiles: { name: string | null; email: string | null; department: string | null } | null;
};

function ClaimsList({ itemId }: { itemId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["claims", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("id, claimer_id, status, message, created_at, verification_answers, profiles:profiles!claims_claimer_id_fkey(name, email, department)")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) {
        // fallback without explicit fkey name
        const alt = await supabase.from("claims").select("*").eq("item_id", itemId).order("created_at", { ascending: false });
        const claims = alt.data ?? [];
        const ids = Array.from(new Set(claims.map((c) => c.claimer_id)));
        const profs = ids.length ? (await supabase.from("profiles").select("id, name, email, department").in("id", ids)).data ?? [] : [];
        return claims.map((c) => ({ ...c, profiles: profs.find((p) => p.id === c.claimer_id) ?? null })) as unknown as ClaimRow[];
      }
      return data as unknown as ClaimRow[];
    },
  });

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("claims").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Claim ${status}`);
    qc.invalidateQueries({ queryKey: ["claims", itemId] });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading claims…</div>;
  if (!data || data.length === 0) return (
    <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">No claims yet.</div>
  );

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-3 font-semibold">Claims ({data.length})</h2>
      <ul className="space-y-4">
        {data.map((c) => (
          <li key={c.id} className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{c.profiles?.name ?? "Unknown user"}</div>
                <div className="text-xs text-muted-foreground">
                  {c.profiles?.email ?? "no email"}{c.profiles?.department ? ` · ${c.profiles.department}` : ""}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${c.status === "approved" ? "bg-success/15 text-success" : c.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-accent"}`}>{c.status}</span>
            </div>
            {c.message && <p className="mt-2 text-sm"><span className="text-muted-foreground">Note:</span> {c.message}</p>}
            {Array.isArray(c.verification_answers) && c.verification_answers.length > 0 && (
              <ol className="mt-2 space-y-1 text-sm">
                {c.verification_answers.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {a.matched ? <CheckCircle2 className="mt-0.5 size-4 text-success" /> : <XCircle className="mt-0.5 size-4 text-destructive" />}
                    <div><span className="text-muted-foreground">{a.question}</span> — {a.submitted || <em className="text-muted-foreground">no answer</em>}</div>
                  </li>
                ))}
              </ol>
            )}
            {c.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => setStatus(c.id, "approved")}>Approve & share contact</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "rejected")}>Reject</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
