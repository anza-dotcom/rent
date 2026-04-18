import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/top-nav";
import { monthBounds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = new Date();
  const { start, end } = monthBounds(now);

  const [propertyCount, unitAgg, collectedAgg] = await Promise.all([
    prisma.property.count(),
    prisma.unit.aggregate({
      _count: { _all: true },
      _sum: { monthlyRent: true },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paymentDate: { gte: start, lt: end },
        status: { not: "failed" },
      },
    }),
  ]);

  return (
    <div className="min-h-screen flex bg-muted/40">
      <Sidebar
        summary={{
          properties: propertyCount,
          units: unitAgg._count._all,
          monthlyPotential: unitAgg._sum.monthlyRent ?? 0,
          collected: collectedAgg._sum.amount ?? 0,
        }}
      />
      <main className="flex-1 pb-24 md:pb-0">
        <div className="p-4 md:p-10 max-w-[1400px] mx-auto">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
