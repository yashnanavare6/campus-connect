import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/my-reports")({
  head: () => ({ meta: [{ title: "My Reports — Foundly" }, { name: "description", content: "Items you have reported." }] }),
  component: MyReports,
});

function MyReports() {
  const { user } = useAuth();
  const lost = useQuery({
    queryKey: ["my-lost", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("lost_items").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const found = useQuery({
    queryKey: ["my-found", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("found_items").select("*").eq("finder_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My reports</h1>
        <p className="text-muted-foreground">Everything you've reported so far.</p>
      </div>
      <Tabs defaultValue="found">
        <TabsList>
          <TabsTrigger value="found">Found ({found.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="lost">Lost ({lost.data?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="found" className="mt-4 grid gap-3">
          {found.isLoading ? <Skeleton className="h-24" /> :
            found.data?.length ? found.data.map((it) => (
              <Link key={it.id} to="/items/$id" params={{ id: it.id }} className="rounded-2xl border bg-card p-4 hover:shadow-md">
                <div className="flex justify-between"><span className="font-semibold">{it.title}</span><span className="text-xs capitalize text-muted-foreground">{it.status}</span></div>
                <div className="text-xs text-muted-foreground">{it.category} · {it.location_found ?? "—"}</div>
              </Link>
            )) : <Empty text="No found items yet." />}
        </TabsContent>
        <TabsContent value="lost" className="mt-4 grid gap-3">
          {lost.isLoading ? <Skeleton className="h-24" /> :
            lost.data?.length ? lost.data.map((it) => (
              <div key={it.id} className="rounded-2xl border bg-card p-4">
                <div className="flex justify-between"><span className="font-semibold">{it.title}</span><span className="text-xs capitalize text-muted-foreground">{it.status}</span></div>
                <div className="text-xs text-muted-foreground">{it.category} · {it.location_lost ?? "—"}</div>
              </div>
            )) : <Empty text="No lost reports yet." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">{text}</div>;
}
