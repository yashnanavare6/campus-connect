import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Foundly" }, { name: "description", content: "Your notifications." }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications-all"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Claim updates and item activity.</p>
      </div>
      <div className="rounded-2xl border bg-card">
        {isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          data && data.length > 0 ? data.map((n) => (
            <div key={n.id} className="flex items-start gap-3 border-b p-4 last:border-b-0">
              <div className="mt-0.5 rounded-full bg-primary-soft p-2 text-primary"><Bell className="size-4" /></div>
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </div>
          )) : <div className="p-8 text-center text-sm text-muted-foreground">All clear — no notifications yet.</div>}
      </div>
    </div>
  );
}
