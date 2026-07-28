import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search, ShieldCheck, Sparkles, Users, Package, CheckCircle2, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Lost & Found — Reunite belongings, securely" },
      { name: "description", content: "The centralized lost & found portal for campus. Verified logins, hidden verification questions, and safe recoveries." },
      { property: "og:title", content: "Campus Lost & Found Portal" },
      { property: "og:description", content: "Report, search, and safely claim lost belongings across campus." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
          <div className="grid size-7 place-items-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
            <Package className="size-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">Foundly</span>
        </div>
        <nav className="glass hidden items-center gap-1 rounded-full px-2 py-1 md:flex">
          <a href="#features" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#faq" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth">
            <Button size="sm" className="rounded-full">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-surface)" }}>
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" /> Built for campuses. Loved by students.
          </div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Lost something on campus?<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-brand)" }}>
              Get it back, safely.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A single, verified portal for reporting and recovering lost items — with hidden verification questions
            that stop fake claims before they happen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="rounded-full">Get started <ArrowRight className="ml-1 size-4" /></Button></Link>
            <a href="#how"><Button variant="outline" size="lg" className="rounded-full">See how it works</Button></a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-16 max-w-4xl">
          <div className="glass rounded-3xl p-4 shadow-[var(--shadow-glow)]">
            <div className="rounded-2xl border bg-card p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "Blue Hydro flask", loc: "Library, 2nd floor", status: "Open" },
                  { title: "Silver AirPods case", loc: "Lecture Hall B", status: "Claim in review" },
                  { title: "Student ID — J.K.", loc: "Cafeteria", status: "Recovered" },
                ].map((c, i) => (
                  <motion.div key={i} whileHover={{ y: -4 }} className="rounded-xl border bg-background p-4">
                    <div className="mb-3 aspect-video rounded-lg" style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--muted))" }} />
                    <div className="text-sm font-semibold">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.loc}</div>
                    <div className="mt-3 inline-flex rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">{c.status}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { v: "12,340", l: "Items catalogued" },
    { v: "94%", l: "Recovery rate" },
    { v: "< 48h", l: "Median claim time" },
    { v: "0", l: "Fake claims approved" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.l} className="rounded-2xl border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
            <div className="text-3xl font-bold tracking-tight">{s.v}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    { icon: Lock, t: "Hidden verification", d: "Finders set private questions only the true owner can answer. Nobody else sees them." },
    { icon: ShieldCheck, t: "College-only access", d: "Sign in with your institutional email. Every user is a verified member of the campus." },
    { icon: Search, t: "Fast search", d: "Filter by category, location, keywords, and date. Realtime, debounced, paginated." },
    { icon: Zap, t: "Instant notifications", d: "Get pinged the moment a claim is approved or a match is posted." },
    { icon: Users, t: "Role-based control", d: "Students, faculty, drivers, and admins each get exactly the powers they need." },
    { icon: CheckCircle2, t: "Approval workflow", d: "Finders review answers, approve or reject, and only then share contact." },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Everything you need to recover safely</h2>
        <p className="mt-4 text-muted-foreground">Purpose-built for a real campus, not a generic marketplace.</p>
      </div>
      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {feats.map((f, i) => (
          <motion.div key={f.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="group rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-lg">
            <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Report", d: "The finder uploads photos and public details while keeping key identifiers private." },
    { n: "02", t: "Verify", d: "The rightful owner answers hidden questions only they should know." },
    { n: "03", t: "Recover", d: "Once approved, contact is exchanged and the item is reunited." },
  ];
  return (
    <section id="how" className="border-y bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Three steps. Zero guesswork.</h2>
          <p className="mt-4 text-muted-foreground">A gentle, well-lit process from lost to found.</p>
        </div>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border bg-background p-8 shadow-[var(--shadow-soft)]">
              <div className="text-sm font-mono text-primary">{s.n}</div>
              <div className="mt-3 text-2xl font-semibold">{s.t}</div>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "Got my wallet back in a day. The verification thing is genius.", a: "Priya S., Sophomore" },
    { q: "Way better than the WhatsApp chaos we had before.", a: "Dr. Menon, Faculty" },
    { q: "Clean, fast, and the design actually feels like it belongs on campus.", a: "Aarav K., Junior" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-5 md:grid-cols-3">
        {t.map((x) => (
          <div key={x.a} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
            <p className="text-lg leading-snug">"{x.q}"</p>
            <div className="mt-4 text-sm text-muted-foreground">{x.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Who can sign up?", a: "Anyone with a valid college email — students, faculty, and campus drivers. Admins are appointed manually." },
    { q: "Are hidden questions really hidden?", a: "Yes. Row-level security ensures only the finder and admins can view verification details and contact info." },
    { q: "What if two people try to claim the same item?", a: "Every claim is answered independently. The finder reviews answers and approves the right one." },
    { q: "Can I edit or delete my post?", a: "You can edit or remove your own posts anytime. Admins can moderate suspicious posts." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Questions?</h2>
      </div>
      <Accordion type="single" collapsible className="mt-10">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`i-${i}`} className="border-b">
            <AccordionTrigger className="text-left text-base font-medium">{it.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl p-10 md:p-16" style={{ background: "var(--gradient-brand)" }}>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Ready to find what's yours?</h2>
          <p className="mt-3 text-white/90">Sign in with your college email and get moving in under a minute.</p>
          <div className="mt-6">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="rounded-full">
                Sign in <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <div>© {new Date().getFullYear()} Foundly. A campus lost & found portal.</div>
        <div className="flex gap-4">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
