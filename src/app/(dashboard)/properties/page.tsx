import { Building2, Home, DollarSign, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/dashboard/property-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { unitStatusForMonth } from "@/lib/payments";
import { formatMoney, monthBounds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const now = new Date();
  const { start, end } = monthBounds(now);

  const properties = await prisma.property.findMany({
    include: {
      units: {
        include: {
          payments: { where: { paymentDate: { gte: start, lt: end } } },
        },
      },
    },
    orderBy: { address: "asc" },
  });

  let totalMonthly = 0;
  let totalCollected = 0;
  let totalUnits = 0;
  let totalOccupied = 0;

  const cards = properties.map((p) => {
    let monthlyRent = 0;
    let collected = 0;
    let occupied = 0;
    let paid = 0;
    let pending = 0;
    let late = 0;
    for (const u of p.units) {
      monthlyRent += u.monthlyRent;
      totalMonthly += u.monthlyRent;
      totalUnits++;
      if (u.monthlyRent > 0 && u.tenantName !== "Vacant") {
        occupied++;
        totalOccupied++;
      }
      const s = unitStatusForMonth(u, u.payments, now);
      collected += s.collected;
      totalCollected += s.collected;
      if (s.status === "paid") paid++;
      else if (s.status === "late") late++;
      else if (s.status === "pending" || s.status === "partial") pending++;
    }
    return {
      id: p.id,
      address: p.address,
      monthlyRent,
      collected,
      unitCount: p.units.length,
      occupiedCount: occupied,
      paid,
      pending,
      late,
    };
  });

  const occupancyPct =
    totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
        <p className="text-muted-foreground mt-1">
          {properties.length} buildings · {totalUnits} units across the Speranza
          portfolio.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Buildings"
          value={properties.length.toString()}
          sublabel={`${totalUnits} units total`}
          icon={Building2}
        />
        <StatCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          sublabel={`${totalOccupied} occupied · ${totalUnits - totalOccupied} vacant`}
          icon={Home}
          tone="success"
        />
        <StatCard
          label="Monthly potential"
          value={formatMoney(totalMonthly)}
          sublabel="At full occupancy"
          icon={DollarSign}
          tone="accent"
        />
        <StatCard
          label="Collected"
          value={formatMoney(totalCollected)}
          sublabel="This month"
          icon={TrendingUp}
          tone="default"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">All buildings</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
