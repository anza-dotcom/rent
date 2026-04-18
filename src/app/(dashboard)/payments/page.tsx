import Link from "next/link";
import { format } from "date-fns";
import { Plus, Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { PaymentsTable } from "@/components/payments/payments-table";
import { formatMoney, monthBounds } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchParams {
  propertyId?: string;
  method?: string;
  status?: string;
  from?: string;
  to?: string;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const where: {
    unit?: { propertyId: string };
    method?: string;
    status?: string;
    paymentDate?: { gte?: Date; lte?: Date };
  } = {};
  if (sp.propertyId) where.unit = { propertyId: sp.propertyId };
  if (sp.method) where.method = sp.method;
  if (sp.status) where.status = sp.status;
  if (sp.from || sp.to) {
    where.paymentDate = {};
    if (sp.from) where.paymentDate.gte = new Date(sp.from);
    if (sp.to) where.paymentDate.lte = new Date(sp.to);
  }

  const [payments, properties] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { unit: { include: { property: true } } },
      orderBy: { paymentDate: "desc" },
      take: 200,
    }),
    prisma.property.findMany({ orderBy: { address: "asc" } }),
  ]);

  // Month totals (not filter-scoped, always current month)
  const now = new Date();
  const { start, end } = monthBounds(now);
  const monthPayments = await prisma.payment.findMany({
    where: { paymentDate: { gte: start, lt: end } },
    select: { amount: true, status: true },
  });
  const monthTotal = monthPayments
    .filter((p) => p.status !== "failed")
    .reduce((s, p) => s + p.amount, 0);
  const clearedCount = monthPayments.filter((p) => p.status === "cleared").length;
  const pendingCount = monthPayments.filter((p) => p.status === "pending").length;
  const failedCount = monthPayments.filter((p) => p.status === "failed").length;

  const rows = payments.map((p) => ({
    id: p.id,
    date: format(p.paymentDate, "MMM d, yyyy"),
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: p.reference,
    unit: `${p.unit.unitName} — ${p.unit.tenantName}`,
    property: p.unit.property.address,
    propertyId: p.unit.propertyId,
    unitId: p.unitId,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Every rental payment across the portfolio, filterable and searchable.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/payments/new">
            <Plus className="h-4 w-4" /> Add payment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Collected · ${format(now, "MMM")}`}
          value={formatMoney(monthTotal)}
          sublabel={`${monthPayments.length} payment${
            monthPayments.length === 1 ? "" : "s"
          } this month`}
          icon={Receipt}
          tone="success"
        />
        <StatCard
          label="Cleared"
          value={clearedCount.toString()}
          sublabel="Payments confirmed"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Pending"
          value={pendingCount.toString()}
          sublabel="Awaiting clearing"
          icon={Clock}
          tone={pendingCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Failed"
          value={failedCount.toString()}
          sublabel={
            failedCount > 0 ? "Needs manual review" : "No failed payments"
          }
          icon={XCircle}
          tone={failedCount > 0 ? "destructive" : "default"}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <div className="text-lg font-semibold tracking-tight">Ledger</div>
            <div className="text-sm text-muted-foreground">
              Showing {rows.length} of most recent 200 payments.
            </div>
          </div>
        </div>
        <PaymentsTable rows={rows} properties={properties} initialFilters={sp} />
      </Card>
    </div>
  );
}
