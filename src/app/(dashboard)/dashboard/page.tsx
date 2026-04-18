import Link from "next/link";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Home,
  ArrowUpRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { PropertyCard } from "@/components/dashboard/property-card";
import { Button } from "@/components/ui/button";
import { unitStatusForMonth } from "@/lib/payments";
import { formatMoney, monthBounds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const { start, end } = monthBounds(now);

  const properties = await prisma.property.findMany({
    include: {
      units: {
        include: {
          payments: {
            where: { paymentDate: { gte: start, lt: end } },
          },
        },
      },
    },
    orderBy: { address: "asc" },
  });

  let totalRentPotential = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let lateCount = 0;
  let occupiedTotal = 0;
  let unitTotal = 0;

  const propertyCards = properties.map((p) => {
    let pMonthly = 0;
    let pCollected = 0;
    let pOccupied = 0;
    let pPaid = 0;
    let pPending = 0;
    let pLate = 0;
    for (const u of p.units) {
      unitTotal++;
      pMonthly += u.monthlyRent;
      totalRentPotential += u.monthlyRent;
      if (u.monthlyRent > 0 && u.tenantName !== "Vacant") {
        pOccupied++;
        occupiedTotal++;
      }
      const s = unitStatusForMonth(u, u.payments, now);
      pCollected += s.collected;
      totalCollected += s.collected;
      if (s.status === "paid") {
        paidCount++;
        pPaid++;
      } else if (s.status === "late") {
        lateCount++;
        pLate++;
      } else if (s.status === "pending" || s.status === "partial") {
        pendingCount++;
        pPending++;
      }
    }
    return {
      id: p.id,
      address: p.address,
      monthlyRent: pMonthly,
      collected: pCollected,
      unitCount: p.units.length,
      occupiedCount: pOccupied,
      paid: pPaid,
      pending: pPending,
      late: pLate,
    };
  });

  const collectionPct =
    totalRentPotential > 0
      ? Math.round((totalCollected / totalRentPotential) * 100)
      : 0;
  const occupancyPct =
    unitTotal > 0 ? Math.round((occupiedTotal / unitTotal) * 100) : 0;
  const outstanding = Math.max(0, totalRentPotential - totalCollected);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-hero p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(now, "EEEE, MMMM d, yyyy")}
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Good {greeting(now)}.
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Here&apos;s where the portfolio stands for {format(now, "MMMM yyyy")}.
              {lateCount === 0
                ? " Everything is on track."
                : ` ${lateCount} unit${lateCount === 1 ? "" : "s"} need${
                    lateCount === 1 ? "s" : ""
                  } attention.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Collected this month
              </div>
              <div className="money-num text-4xl md:text-5xl font-semibold tracking-tight">
                {formatMoney(totalCollected)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                of {formatMoney(totalRentPotential)} potential ·{" "}
                <span
                  className={
                    collectionPct >= 90
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : collectionPct >= 50
                      ? "text-amber-600 dark:text-amber-400 font-medium"
                      : "text-rose-600 dark:text-rose-400 font-medium"
                  }
                >
                  {collectionPct}%
                </span>
              </div>
            </div>
            <Button asChild size="lg" className="shadow-md">
              <Link href="/payments/new">
                <Sparkles className="h-4 w-4" />
                Log a payment
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 h-2 bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-emerald-400 to-emerald-300 transition-all"
            style={{ width: `${collectionPct}%` }}
          />
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly potential"
          value={formatMoney(totalRentPotential)}
          sublabel={`${properties.length} buildings · ${unitTotal} units`}
          icon={DollarSign}
          tone="accent"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          sublabel={`${pendingCount + lateCount} unit${
            pendingCount + lateCount === 1 ? "" : "s"
          } remaining`}
          icon={TrendingUp}
          tone={outstanding === 0 ? "success" : lateCount > 0 ? "destructive" : "warning"}
        />
        <StatCard
          label="Paid / Pending / Late"
          value={`${paidCount} · ${pendingCount} · ${lateCount}`}
          sublabel="Units this month"
          icon={CheckCircle2}
          tone={lateCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          sublabel={`${occupiedTotal} of ${unitTotal} units occupied`}
          icon={Home}
          tone="default"
        />
      </section>

      {/* Alert */}
      {lateCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10">
          <div className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 text-sm">
            <div className="font-medium text-amber-900 dark:text-amber-100">
              {lateCount} unit{lateCount === 1 ? "" : "s"} late on rent
            </div>
            <div className="text-amber-800/80 dark:text-amber-200/80 mt-0.5">
              These tenants haven&apos;t paid by the 5th of the month.
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-amber-800 dark:text-amber-100">
            <Link href="/reports">
              Review <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Properties */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Properties</h2>
            <p className="text-sm text-muted-foreground">
              {properties.length} buildings across the portfolio.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/properties">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {propertyCards.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
