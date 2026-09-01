import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, CalendarClock, CreditCard, Lock, Plus, Repeat, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCadence } from "@/lib/store";
import { PlanComposer } from "@/components/plan-composer";
import { CheckoutFlow } from "@/components/checkout-flow";
import { useStripeConfig } from "@/components/providers";

const NAV = [
  { to: "/", label: "Home", icon: Repeat },
  { to: "/plans", label: "Plans", icon: CalendarClock },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openComposer = useCadence((s) => s.openComposer);
  const { config } = useStripeConfig();
  const live = Boolean(config?.configured);

  return (
    <div id="app-root" className="min-h-dvh bg-bg text-fg">
      <aside className="fixed top-0 left-0 hidden h-dvh w-56 flex-col border-r border-border px-4 py-6 md:flex">
        <Link to="/" className="px-2">
          <p className="font-display text-2xl font-medium italic">Cadence</p>
          <p className="mt-1 text-xs tracking-wide text-subtle uppercase">
            To Tangem
          </p>
        </Link>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
                  active
                    ? "bg-secondary text-fg"
                    : "text-muted hover:bg-secondary/70 hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button className="w-full" onClick={openComposer}>
          <Plus className="size-4" />
          New cadence
        </Button>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="md:hidden">
            <p className="font-display text-xl italic">Cadence</p>
          </div>
          <p className="hidden text-xs tracking-wide text-subtle uppercase md:block">
            {live
              ? "Stripe connected · cards never touch Cadence"
              : "Preview · live prices · connect Stripe to charge"}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted sm:inline-flex">
              {live ? <Lock className="size-3" /> : <CreditCard className="size-3" />}
              {live ? "Stripe PCI" : "Demo rail"}
            </span>
            <Button size="sm" className="md:hidden" onClick={openComposer}>
              <Plus className="size-4" />
              New
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed right-0 bottom-0 left-0 z-20 border-t border-border bg-bg/90 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-fg" : "text-subtle",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2 : 1.6} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <PlanComposer />
      <CheckoutFlow />
    </div>
  );
}
