import Link from "next/link";
import { Building2, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";

interface Props {
  property: {
    id: string;
    address: string;
    monthlyRent: number;
    collected: number;
    unitCount: number;
    occupiedCount: number;
    paid?: number;
    pending?: number;
    late?: number;
  };
}

export function PropertyCard({ property }: Props) {
  const collectionPct =
    property.monthlyRent > 0
      ? Math.min(100, Math.round((property.collected / property.monthlyRent) * 100))
      : 0;
  const occupancyPct =
    property.unitCount > 0
      ? Math.round((property.occupiedCount / property.unitCount) * 100)
      : 0;

  const barColor =
    collectionPct >= 100
      ? "from-emerald-500 to-emerald-300"
      : collectionPct >= 50
      ? "from-amber-500 to-amber-300"
      : collectionPct > 0
      ? "from-rose-500 to-rose-300"
      : "from-muted to-muted";

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <Card className="p-5 card-gloss transition-all group-hover:border-primary/40 group-hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/10">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate tracking-tight">
                {property.address}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {property.unitCount} units · {property.occupiedCount} occupied ·{" "}
                {occupancyPct}%
              </div>
            </div>
          </div>
          <div className="rounded-full h-7 w-7 flex items-center justify-center bg-muted/70 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Collected
              </div>
              <div className="money-num text-xl font-semibold mt-0.5">
                {formatMoney(property.collected)}
                <span className="text-sm text-muted-foreground font-normal">
                  {" "}
                  / {formatMoney(property.monthlyRent)}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "text-sm font-semibold",
                collectionPct >= 100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : collectionPct >= 50
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {collectionPct}%
            </div>
          </div>

          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full bg-gradient-to-r transition-all", barColor)}
              style={{ width: `${collectionPct}%` }}
            />
          </div>

          {(property.paid !== undefined ||
            property.pending !== undefined ||
            property.late !== undefined) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {property.paid !== undefined && property.paid > 0 && (
                <Pill color="emerald" label={`${property.paid} paid`} />
              )}
              {property.pending !== undefined && property.pending > 0 && (
                <Pill color="amber" label={`${property.pending} pending`} />
              )}
              {property.late !== undefined && property.late > 0 && (
                <Pill color="rose" label={`${property.late} late`} />
              )}
              {property.unitCount - property.occupiedCount > 0 && (
                <Pill
                  color="slate"
                  label={`${property.unitCount - property.occupiedCount} vacant`}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

function Pill({
  color,
  label,
}: {
  color: "emerald" | "amber" | "rose" | "slate";
  label: string;
}) {
  const colors: Record<typeof color, string> = {
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    slate: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        colors[color]
      )}
    >
      {label}
    </span>
  );
}
