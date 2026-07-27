import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Foundly" }, { name: "description", content: "Your account." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
            {(profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{profile?.full_name || "Unnamed"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="mt-6">
          <Button variant="outline" onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
            nav({ to: "/auth" });
          }}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
