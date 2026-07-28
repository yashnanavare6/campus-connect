import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-profile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Package,
  PackageSearch,
  ClipboardCheck,
  ShieldAlert,
  Trash2,
  UserPlus,
  BarChart3,
  Bus,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Foundly" },
      { name: "description", content: "Admin dashboard to track all website activity." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading…
      </div>
    );
  if (!isAdmin)
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
        <ShieldAlert className="mx-auto mb-3 size-10 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="mt-1">You need admin privileges to view this page.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Track and manage all activity across the platform.
        </p>
      </div>

      <StatsOverview />

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="gap-1">
            <Users className="size-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1">
            <Bus className="size-3.5" /> Drivers
          </TabsTrigger>
          <TabsTrigger value="found" className="gap-1">
            <Package className="size-3.5" /> Found
          </TabsTrigger>
          <TabsTrigger value="lost" className="gap-1">
            <PackageSearch className="size-3.5" /> Lost
          </TabsTrigger>
          <TabsTrigger value="claims" className="gap-1">
            <ClipboardCheck className="size-3.5" /> Claims
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="drivers" className="mt-4">
          <DriversTab />
        </TabsContent>
        <TabsContent value="found" className="mt-4">
          <FoundItemsTab />
        </TabsContent>
        <TabsContent value="lost" className="mt-4">
          <LostItemsTab />
        </TabsContent>
        <TabsContent value="claims" className="mt-4">
          <ClaimsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, drivers, found, lost, claims, pendingClaims] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "driver"),
          supabase
            .from("found_items")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("lost_items")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("claims")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("claims")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
        ]);
      return {
        users: users.count ?? 0,
        drivers: drivers.count ?? 0,
        found: found.count ?? 0,
        lost: lost.count ?? 0,
        claims: claims.count ?? 0,
        pendingClaims: pendingClaims.count ?? 0,
      };
    },
  });

  const cards = [
    {
      label: "Total Users",
      value: stats.data?.users,
      icon: Users,
      tone: "bg-info/10 text-info",
    },
    {
      label: "Drivers",
      value: stats.data?.drivers,
      icon: Bus,
      tone: "bg-primary-soft text-primary",
    },
    {
      label: "Found Items",
      value: stats.data?.found,
      icon: Package,
      tone: "bg-success/15 text-success",
    },
    {
      label: "Lost Items",
      value: stats.data?.lost,
      icon: PackageSearch,
      tone: "bg-warning/20 text-warning-foreground",
    },
    {
      label: "Total Claims",
      value: stats.data?.claims,
      icon: ClipboardCheck,
      tone: "bg-accent text-accent-foreground",
    },
    {
      label: "Pending Claims",
      value: stats.data?.pendingClaims,
      icon: BarChart3,
      tone: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)]"
        >
          <div
            className={`inline-flex size-9 items-center justify-center rounded-xl ${c.tone}`}
          >
            <c.icon className="size-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {stats.isLoading ? "…" : (c.value ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User promoted to admin");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const roleColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-info/10 text-info";
      case "faculty":
        return "bg-primary-soft text-primary";
      case "driver":
        return "bg-success/15 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Department</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleColor(u.role)}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {u.department || "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => promoteToAdmin.mutate(u.id)}
                    title="Promote to admin"
                  >
                    <UserPlus className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!users.data?.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriversTab() {
  const drivers = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "driver")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Registered Drivers</h2>
        <Badge variant="secondary">{drivers.data?.length ?? 0} drivers</Badge>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Department</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {drivers.data?.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3 text-muted-foreground">{d.email}</td>
                  <td className="p-3 text-muted-foreground">
                    {d.department || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!drivers.data?.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No drivers registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FoundItemsTab() {
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["admin-found-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("found_items")
        .select("*, profiles!found_items_finder_id_fkey(name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        // fallback without join if FK name doesn't match
        const { data: fallback } = await supabase
          .from("found_items")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        return fallback ?? [];
      }
      return data ?? [];
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("found_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["admin-found-items"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-success/15 text-success";
      case "claimed":
        return "bg-warning/20 text-warning-foreground";
      case "recovered":
        return "bg-info/10 text-info";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date Found</th>
              <th className="p-3">Posted</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.data?.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-medium">{item.title}</td>
                <td className="p-3 text-muted-foreground">{item.category}</td>
                <td className="p-3 text-muted-foreground">
                  {item.location_found || "—"}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {item.date_found
                    ? new Date(item.date_found).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteItem.mutate(item.id)}
                    title="Delete item"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!items.data?.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No found items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LostItemsTab() {
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["admin-lost-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lost_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["admin-lost-items"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-success/15 text-success";
      case "claimed":
        return "bg-warning/20 text-warning-foreground";
      case "recovered":
        return "bg-info/10 text-info";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date Lost</th>
              <th className="p-3">Posted</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.data?.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-medium">{item.title}</td>
                <td className="p-3 text-muted-foreground">{item.category}</td>
                <td className="p-3 text-muted-foreground">
                  {item.location_lost || "—"}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {item.date_lost
                    ? new Date(item.date_lost).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteItem.mutate(item.id)}
                    title="Delete item"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!items.data?.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No lost items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClaimsTab() {
  const qc = useQueryClient();
  const claims = useQuery({
    queryKey: ["admin-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => {
      const { error } = await supabase
        .from("claims")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Claim updated");
      qc.invalidateQueries({ queryKey: ["admin-claims"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/20 text-warning-foreground";
      case "approved":
        return "bg-success/15 text-success";
      case "rejected":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Claim ID</th>
              <th className="p-3">Item</th>
              <th className="p-3">Status</th>
              <th className="p-3">Message</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.data?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono text-xs">
                  {c.id.slice(0, 8)}…
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {c.item_id.slice(0, 8)}…
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(c.status)}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="max-w-[200px] truncate p-3 text-muted-foreground">
                  {c.message || "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  {c.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success hover:text-success"
                        onClick={() =>
                          updateStatus.mutate({
                            id: c.id,
                            status: "approved",
                          })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          updateStatus.mutate({
                            id: c.id,
                            status: "rejected",
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!claims.data?.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No claims yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}