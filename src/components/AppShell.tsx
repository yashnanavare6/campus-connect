import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Search, PackageSearch, PackagePlus, User, Bell, ShieldAlert, LogOut, Menu, Package, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin, useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Browse", icon: Search },
  { to: "/report-lost", label: "Report Lost", icon: PackageSearch },
  { to: "/report-found", label: "Report Found", icon: PackagePlus },
  { to: "/my-reports", label: "My Reports", icon: ClipboardList },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-2 px-2 py-4">
        <div className="grid size-8 place-items-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
          <Package className="size-4 text-white" />
        </div>
        <span className="font-semibold tracking-tight">Foundly</span>
      </Link>
      <nav className="mt-2 flex-1 space-y-1">
        {nav.map((n) => <NavItem key={n.to} {...n} onClick={() => setOpen(false)} />)}
        {isAdmin && <NavItem to="/admin" label="Admin" icon={ShieldAlert} onClick={() => setOpen(false)} />}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 truncate px-2 text-xs text-muted-foreground">{profile?.email}</div>
        <SignOut />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar px-3 md:block">
        <NavContent />
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
              <Package className="size-4 text-white" />
            </div>
            <span className="font-semibold">Foundly</span>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 px-3">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>
        <NotifDot userId={user?.id} />
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, onClick }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        active ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function SignOut() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <Button variant="ghost" className="w-full justify-start" onClick={async () => {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Signed out");
      navigate({ to: "/auth", replace: true });
    }}>
      <LogOut className="mr-2 size-4" /> Sign out
    </Button>
  );
}

function NotifDot({ userId }: { userId?: string }) {
  useQuery({
    queryKey: ["unread-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });
  return null;
}
