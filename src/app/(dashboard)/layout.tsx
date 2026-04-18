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
  });

  let monthlyPotential = 0;
  let collected = 0;
  let units = 0;
  for (const p of properties) {
    for (const u of p.units) {
      units++;
      monthlyPotential += u.monthlyRent;
      for (const pay of u.payments) {
        if (pay.status !== "failed") collected += pay.amount;
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-muted/40">
      <Sidebar
        summary={{
          properties: properties.length,
          units,
          monthlyPotential,
          collected,
        }}
      />
      <main className="flex-1 pb-24 md:pb-0">
        <div className="p-4 md:p-10 max-w-[1400px] mx-auto">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
