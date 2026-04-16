import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { PropertyCard } from "@/components/dashboard/property-card";
import { unitStatusForMonth } from "@/lib/payments";
import { formatMoney, monthBounds } from "@/lib/utils";
import { DollarSign, TrendingUp, CheckCircle2, Clock, AlertTriangle, Home } from "lucide-react";
import { format } from "date-fns";

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
      if (s.status === "paid") paidCount++;
      else if (s.status === "late") lateCount++;
      else if (s.status === "pending" || s.status === "partial") pendingCount++;
    }
    return {
      id: p.id,
      address: p.address,
      monthlyRent: pMonthly,
      collected: pCollected,
      unitCount: p.units.length,
      occupiedCount: pOccupied,
    };
  });

  const collectionPct =
    totalRentPotential > 0
      ? Math.round((totalCollected / totalRentPotential) * 100)
      : 0;
  const occupancyPct =
    unitTotal > 0 ? Math.round((occupiedTotal / unitTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Portfolio overview for {format(now, "MMMM yyyy")}.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly rent potential"
          value={formatMoney(totalRentPotential)}
          sublabel={`${properties.length} properties • ${unitTotal} units`}
          icon={DollarSign}
        />
        <StatCard
          label="Collected this month"
          value={formatMoney(totalCollected)}
          sublabel={`${collectionPct}% of expected`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Paid / Pending / Late"
          value={`${paidCount} / ${pendingCount} / ${lateCount}`}
          sublabel="Units this month"
          icon={CheckCircle2}
          tone={lateCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          sublabel={`${occupiedTotal} of ${unitTotal} units occupied`}
          icon={Home}
        />
      </div>

      {lateCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{lateCount}</span> unit
            {lateCount === 1 ? "" : "s"} late on rent this month.{" "}
            <a href="/payments" className="underline">
              Review payments →
            </a>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Properties</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Updated just now
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {propertyCards.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
