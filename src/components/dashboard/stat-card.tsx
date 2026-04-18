import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "accent";
  trend?: { value: string; positive?: boolean };
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, { bg: string; text: string; bar: string }> = {
  default: {
    bg: "bg-primary/10",
    text: "text-primary",
    bar: "from-primary to-emerald-400",
  },
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "from-emerald-500 to-emerald-300",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    bar: "from-amber-500 to-amber-300",
  },
  destructive: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    bar: "from-rose-500 to-rose-300",
  },
  accent: {
    bg: "bg-accent/15",
    text: "text-accent-foreground dark:text-amber-300",
    bar: "from-amber-400 to-amber-200",
  },
};

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "default",
  trend,
}: StatCardProps) {
  const t = toneMap[tone];
  return (
    <Card className="relative overflow-hidden card-gloss">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          t.bar
        )}
      />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            {label}
          </div>
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", t.bg)}>
            <Icon className={cn("h-[18px] w-[18px]", t.text)} />
          </div>
        </div>
        <div className="mt-4">
          <div className="money-num text-3xl font-semibold tracking-tight">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            {sublabel && (
              <div className="text-xs text-muted-foreground">{sublabel}</div>
            )}
            {trend && (
              <span
                className={cn(
                  "text-[11px] font-medium px-1.5 py-0.5 rounded",
                  trend.positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
