import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/dashboard/property-card";
import { unitStatusForMonth } from "@/lib/payments";
import { monthBounds } from "@/lib/utils";

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

  const cards = properties.map((p) => {
    let monthlyRent = 0;
    let collected = 0;
    let occupied = 0;
    for (const u of p.units) {
      monthlyRent += u.monthlyRent;
      if (u.monthlyRent > 0 && u.tenantName !== "Vacant") occupied++;
      const s = unitStatusForMonth(u, u.payments, now);
      collected += s.collected;
    }
    return {
      id: p.id,
      address: p.address,
      monthlyRent,
      collected,
      unitCount: p.units.length,
      occupiedCount: occupied,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground">
          {properties.length} properties in the Speranza portfolio.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
