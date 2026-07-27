import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PackageSearch, PackagePlus, ClipboardCheck, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Foundly" },
      { name: "description", content: "Overview of lost and found activity on campus." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [lost, found, claims, recovered] = await Promise.all([
        supabase.from("lost_items").select("*", { count: "exact", head: true }),
        supabase.from("found_items").select("*", { count: "exact", head: true }),
        supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("found_items").select("*", { count: "exact", head: true }).eq("status", "recovered"),
      ]);
      return {
        lost: lost.count ?? 0,
        found: found.count ?? 0,
        pending: claims.count ?? 0,
        recovered: recovered.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["recent-found"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("found_items_public")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const notifs = useQuery({
    queryKey: ["notifs-latest", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Lost items", value: stats.data?.lost, icon: PackageSearch, tone: "bg-info/10 text-info" },
    { label: "Found items", value: stats.data?.found, icon: PackagePlus, tone: "bg-primary-soft text-primary" },
    { label: "Pending claims", value: stats.data?.pending, icon: ClipboardCheck, tone: "bg-warning/20 text-warning-foreground" },
    { label: "Recovered", value: stats.data?.recovered, icon: Package, tone: "bg-success/15 text-success" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">Here's what's happening on campus.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/report-lost"><Button variant="outline">Report Lost</Button></Link>
          <Link to="/report-found"><Button>Report Found</Button></Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className={`inline-flex size-10 items-center justify-center rounded-xl ${c.tone}`}>
              <c.icon className="size-5" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              {stats.isLoading ? <Skeleton className="h-8 w-16" /> : c.value ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </motion.div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent found items</h2>
          <Link to="/search" className="text-sm text-primary hover:underline">Browse all <ArrowRight className="inline size-3" /></Link>
        </div>
        {recent.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : recent.data && recent.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.data.map((it) => (
              <Link key={it.id} to="/items/$id" params={{ id: it.id! }}
                className="group rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 aspect-video rounded-xl bg-muted" style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--muted))" }} />
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{it.title}</div>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">{it.category}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{it.location_found ?? "Unknown location"}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            No items yet. <Link to="/report-found" className="text-primary hover:underline">Report the first one</Link>.
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
        <div className="rounded-2xl border bg-card">
          {notifs.data && notifs.data.length > 0 ? notifs.data.map((n) => (
            <div key={n.id} className="flex items-center justify-between border-b p-4 last:border-b-0">
              <div>
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          )) : (
            <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
          )}
        </div>
      </section>
    </div>
  );
}
