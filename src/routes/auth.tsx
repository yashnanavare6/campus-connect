import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { useEffect } from "react";

const authSearch = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Campus Lost & Found" },
      { name: "description", content: "Sign in with your college email to report and claim items." },
    ],
  }),
  validateSearch: authSearch,
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, "Enter your name").max(80),
  role: z.enum(["student", "faculty", "driver"]),
  department: z.string().trim().max(80).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.redirect ?? "/dashboard" });
    });
  }, [navigate, search.redirect]);

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between p-10 md:flex" style={{ background: "var(--gradient-brand)" }}>
        <Link to="/" className="inline-flex items-center gap-2 text-white">
          <div className="grid size-8 place-items-center rounded-lg bg-white/15">
            <Package className="size-4" />
          </div>
          <span className="font-semibold">Foundly</span>
        </Link>
        <div className="text-white">
          <h2 className="text-4xl font-bold leading-tight">Reunite belongings, securely.</h2>
          <p className="mt-3 max-w-md text-white/85">Verified logins, hidden claim questions, and a workflow that keeps fake claims out.</p>
        </div>
        <div className="text-xs text-white/70">© {new Date().getFullYear()} Foundly</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your college email.</p>

          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={async () => {
              const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
              if (res.error) toast.error(res.error.message);
              if (!res.error && !res.redirected) navigate({ to: search.redirect ?? "/dashboard" });
            }}>
              <GoogleIcon /> Continue with Google
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <SignInForm onDone={() => navigate({ to: search.redirect ?? "/dashboard" })} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm onDone={() => navigate({ to: search.redirect ?? "/dashboard" })} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signInSchema) });

  return (
    <form onSubmit={handleSubmit(async (v) => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword(v);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back");
      onDone();
    })} className="space-y-4">
      <div>
        <Label htmlFor="email">College email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@college.edu" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: "student" as const },
  });

  return (
    <form onSubmit={handleSubmit(async (v) => {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { name: v.name, role: v.role, department: v.department ?? null },
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. Check your email to verify.");
      onDone();
    })} className="space-y-3">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Role</Label>
          <Select defaultValue="student" onValueChange={(v) => setValue("role", v as "student" | "faculty" | "driver")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input id="department" placeholder="Optional" {...register("department")} />
        </div>
      </div>
      <div>
        <Label htmlFor="su-email">College email</Label>
        <Input id="su-email" type="email" placeholder="you@college.edu" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="su-pw">Password</Label>
        <Input id="su-pw" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="mr-2 size-4">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
