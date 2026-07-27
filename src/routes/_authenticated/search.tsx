import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { Search as SearchIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Browse — Foundly" },
      { name: "description", content: "Search lost and found items on campus." },
    ],
  }),
  component: SearchPage,
});

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useMemo(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [tab, setTab] = useState<"found" | "lost">("found");
  const dq = useDebounced(q, 250);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Browse items</h1>
        <p className="text-muted-foreground">Search lost reports or found items across campus.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] md:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, location or keyword..." className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "found" | "lost")}>
        <TabsList>
          <TabsTrigger value="found">Found items</TabsTrigger>
          <TabsTrigger value="lost">Lost reports</TabsTrigger>
        </TabsList>
        <TabsContent value="found" className="mt-6"><FoundGrid q={dq} cat={cat} /></TabsContent>
        <TabsContent value="lost" className="mt-6"><LostGrid q={dq} cat={cat} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FoundGrid({ q, cat }: { q: string; cat: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["found-search", q, cat],
    queryFn: async () => {
      let query = supabase.from("found_items_public").select("*").order("created_at", { ascending: false }).limit(60);
      if (cat !== "all") query = query.eq("category", cat);
      if (q) query = query.or(`title.ilike.%${q}%,public_description.ilike.%${q}%,location_found.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <SkelGrid />;
  if (!data || data.length === 0) return <Empty />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((it) => (
        <Link key={it.id} to="/items/$id" params={{ id: it.id! }}
          className="group rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-3 aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--muted))" }} />
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold">{it.title}</div>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">{it.category}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{it.location_found ?? "—"}</div>
          <div className="mt-2 text-xs text-muted-foreground capitalize">{it.status}</div>
        </Link>
      ))}
    </div>
  );
}

function LostGrid({ q, cat }: { q: string; cat: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["lost-search", q, cat],
    queryFn: async () => {
      let query = supabase.from("lost_items").select("*").order("created_at", { ascending: false }).limit(60);
      if (cat !== "all") query = query.eq("category", cat);
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location_lost.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <SkelGrid />;
  if (!data || data.length === 0) return <Empty />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((it) => (
        <div key={it.id} className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-3 aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, var(--muted), var(--accent))" }} />
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold">{it.title}</div>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{it.category}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{it.location_lost ?? "—"}</div>
          {it.description && <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{it.description}</div>}
        </div>
      ))}
    </div>
  );
}

function SkelGrid() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>;
}

function Empty() {
  return <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">No matches. Try different keywords.</div>;
}
