import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Foundly" }, { name: "description", content: "Admin dashboard." }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const claims = useQuery({
    queryKey: ["admin-claims"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("claims").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Admins only.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Recent claims across the portal.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Item</th><th className="p-3">Status</th><th className="p-3">When</th></tr></thead>
          <tbody>
            {claims.data?.map((c) => (
              <tr key={c.id} className="border-t"><td className="p-3">{c.item_id.slice(0, 8)}…</td><td className="p-3 capitalize">{c.status}</td><td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleString()}</td></tr>
            ))}
            {!claims.data?.length && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No claims yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
