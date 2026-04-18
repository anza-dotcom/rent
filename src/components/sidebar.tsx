"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn, formatMoneyCompact } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/payments", label: "Payments", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  summary: {
    properties: number;
    units: number;
    monthlyPotential: number;
    collected: number;
  };
}

export function Sidebar({ summary }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const pct =
    summary.monthlyPotential > 0
      ? Math.min(100, Math.round((summary.collected / summary.monthlyPotential) * 100))
      : 0;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-72 shrink-0 bg-sidebar text-sidebar-fg flex-col border-r border-sidebar">
      <div className="h-20 flex items-center gap-3 px-6 border-b border-sidebar">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-[15px] tracking-tight">Speranza</div>
          <div className="text-[11px] uppercase tracking-widest text-sidebar-muted">
            Properties
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        <div className="rounded-xl bg-white/5 border border-sidebar p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-sidebar-muted">
              This month
            </span>
            <span
              className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                pct >= 90
                  ? "bg-emerald-500/15 text-emerald-300"
                  : pct >= 50
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-rose-500/15 text-rose-300"
              )}
            >
              {pct}%
            </span>
          </div>
          <div>
            <div className="money-num text-2xl font-semibold text-sidebar-fg">
              {formatMoneyCompact(summary.collected)}
              <span className="text-sm text-sidebar-muted font-normal">
                {" "}
                / {formatMoneyCompact(summary.monthlyPotential)}
              </span>
            </div>
            <div className="text-xs text-sidebar-muted mt-0.5">
              collected of potential
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 pt-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/5 text-sidebar-fg font-medium"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  active ? "text-primary" : "text-sidebar-muted group-hover:text-sidebar-fg"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-sidebar-muted">
              Units
            </div>
            <div className="text-base font-semibold money-num">{summary.units}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-sidebar-muted">
              Buildings
            </div>
            <div className="text-base font-semibold money-num">{summary.properties}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <div className="flex items-center gap-2 text-[11px] text-sidebar-muted pt-1">
          <TrendingUp className="h-3 w-3" />
          <span>3 Brothers Portfolio</span>
        </div>
      </div>
    </aside>
  );
}
